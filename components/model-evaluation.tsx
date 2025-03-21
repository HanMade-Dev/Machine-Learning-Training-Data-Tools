"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface ModelEvaluationProps {
  evaluation: {
    modelType: string
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    confusionMatrix: number[][]
    classNames?: string[]
    classReport?: any
  }
  model?: any
  featureColumns?: string[]
  modelFormat?: string
  onModelFormatChange?: (format: string) => void
}

export default function ModelEvaluation({
  evaluation,
  model,
  featureColumns = [],
  modelFormat = "pkl",
  onModelFormatChange = () => {},
}: ModelEvaluationProps) {
  const [predictionTab, setPredictionTab] = useState("metrics")
  const [predictionInput, setPredictionInput] = useState<Record<string, string>>({})
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionResult, setPredictionResult] = useState<any>(null)
  const [predictionError, setPredictionError] = useState<string | null>(null)

  const metricsData = [
    { name: "Accuracy", value: evaluation.accuracy },
    { name: "Precision", value: evaluation.precision },
    { name: "Recall", value: evaluation.recall },
    { name: "F1 Score", value: evaluation.f1Score },
  ]

  const getModelName = (type: string) => {
    switch (type) {
      case "decision_tree":
        return "Decision Tree"
      case "random_forest":
        return "Random Forest"
      case "svm":
        return "Support Vector Machine"
      case "knn":
        return "K-Nearest Neighbors"
      case "naive_bayes":
        return "Naive Bayes"
      default:
        return type
    }
  }

  const featureImportanceData =
    model?.featureImportance && featureColumns.length > 0
      ? featureColumns
          .map((col, index) => ({
            name: col,
            importance: model.featureImportance[index] || 0,
          }))
          .sort((a, b) => b.importance - a.importance)
          .slice(0, 10)
      : []

  const handleInputChange = (feature: string, value: string) => {
    setPredictionInput({
      ...predictionInput,
      [feature]: value,
    })
  }

  const makePrediction = async () => {
    if (!model?.serializedModel) {
      setPredictionError("No trained model available")
      return
    }

    setIsPredicting(true)
    setPredictionError(null)
    setPredictionResult(null)

    try {
      // Convert input to array of features in the same order as featureColumns
      const newData = [
        featureColumns.map((feature) => {
          const value = Number.parseFloat(predictionInput[feature] || "0")
          return isNaN(value) ? 0 : value
        }),
      ]

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serializedModel: model.serializedModel,
          newData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to make prediction")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Unknown error during prediction")
      }

      // Format the prediction result
      const prediction = result.predictions[0]
      const className = model.classNames ? model.classNames[prediction] : prediction

      let probabilities = null
      if (result.probabilities && result.probabilities.length > 0) {
        probabilities = result.probabilities[0].map((prob: number, index: number) => ({
          class: model.classNames ? model.classNames[index] : index,
          probability: prob,
        }))
      }

      setPredictionResult({
        prediction: className,
        probabilities,
      })
    } catch (error: any) {
      console.error("Error making prediction:", error)
      setPredictionError(error.message || "An error occurred during prediction")
    } finally {
      setIsPredicting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={predictionTab} onValueChange={setPredictionTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="metrics">Model Metrics</TabsTrigger>
          <TabsTrigger value="predict">Make Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">{getModelName(evaluation.modelType)}</h3>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metricsData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip formatter={(value: number) => value.toFixed(4)} />
                    <Legend />
                    <Bar dataKey="value" name="Score" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {featureImportanceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={featureImportanceData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip formatter={(value: number) => value.toFixed(4)} />
                      <Legend />
                      <Bar dataKey="importance" name="Importance" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Confusion Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2"></th>
                      {evaluation.classNames &&
                        evaluation.classNames.map((className, index) => (
                          <th key={index} className="border p-2 bg-gray-100">
                            Predicted {className}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {evaluation.confusionMatrix.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <th className="border p-2 bg-gray-100">
                          Actual {evaluation.classNames ? evaluation.classNames[rowIndex] : rowIndex}
                        </th>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={`border p-2 text-center font-medium ${
                              rowIndex === cellIndex ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Remove the grid of TP, FP, FN, TN since it only applies to binary classification */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-md">
                  <h4 className="text-sm font-medium mb-2">Accuracy</h4>
                  <p className="text-2xl font-bold">{evaluation.accuracy.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">Proportion of correct predictions</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="text-sm font-medium mb-2">Precision</h4>
                  <p className="text-2xl font-bold">{evaluation.precision.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">Proportion of positive identifications that were correct</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="text-sm font-medium mb-2">Recall</h4>
                  <p className="text-2xl font-bold">{evaluation.recall.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Proportion of actual positives that were identified correctly
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="text-sm font-medium mb-2">F1 Score</h4>
                  <p className="text-2xl font-bold">{evaluation.f1Score.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">Harmonic mean of precision and recall</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {evaluation.classReport && (
            <Card>
              <CardHeader>
                <CardTitle>Per-Class Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-gray-100">Class</th>
                        <th className="border p-2 bg-gray-100">Precision</th>
                        <th className="border p-2 bg-gray-100">Recall</th>
                        <th className="border p-2 bg-gray-100">F1-Score</th>
                        <th className="border p-2 bg-gray-100">Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(evaluation.classReport)
                        .filter((key) => !["accuracy", "macro avg", "weighted avg"].includes(key))
                        .map((className) => (
                          <tr key={className}>
                            <td className="border p-2 font-medium">{className}</td>
                            <td className="border p-2 text-center">
                              {evaluation.classReport[className].precision.toFixed(4)}
                            </td>
                            <td className="border p-2 text-center">
                              {evaluation.classReport[className].recall.toFixed(4)}
                            </td>
                            <td className="border p-2 text-center">
                              {evaluation.classReport[className]["f1-score"].toFixed(4)}
                            </td>
                            <td className="border p-2 text-center">{evaluation.classReport[className].support}</td>
                          </tr>
                        ))}
                      <tr className="bg-gray-50">
                        <td className="border p-2 font-medium">macro avg</td>
                        <td className="border p-2 text-center">
                          {evaluation.classReport["macro avg"].precision.toFixed(4)}
                        </td>
                        <td className="border p-2 text-center">
                          {evaluation.classReport["macro avg"].recall.toFixed(4)}
                        </td>
                        <td className="border p-2 text-center">
                          {evaluation.classReport["macro avg"]["f1-score"].toFixed(4)}
                        </td>
                        <td className="border p-2 text-center">{evaluation.classReport["macro avg"].support}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border p-2 font-medium">weighted avg</td>
                        <td className="border p-2 text-center">
                          {evaluation.classReport["weighted avg"].precision.toFixed(4)}
                        </td>
                        <td className="border p-2 text-center">
                          {evaluation.classReport["weighted avg"].recall.toFixed(4)}
                        </td>
                        <td className="border p-2 text-center">
                          {evaluation.classReport["weighted avg"]["f1-score"].toFixed(4)}
                        </td>
                        <td className="border p-2 text-center">{evaluation.classReport["weighted avg"].support}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-4 sm:col-span-2">
                    <Label htmlFor="model-format">Model Format</Label>
                    <Select value={modelFormat} onValueChange={onModelFormatChange}>
                      <SelectTrigger id="model-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pkl">Model (.pkl)</SelectItem>
                        <SelectItem value="json">Model (.json)</SelectItem>
                        <SelectItem value="xml">Model (.xml)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Select the format for exporting your trained model</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predict" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Make Predictions</CardTitle>
              <CardDescription>Enter feature values to get predictions from your trained model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featureColumns.map((feature) => (
                    <div key={feature} className="space-y-2">
                      <Label htmlFor={`feature-${feature}`}>{feature}</Label>
                      <Input
                        id={`feature-${feature}`}
                        type="number"
                        placeholder="0"
                        value={predictionInput[feature] || ""}
                        onChange={(e) => handleInputChange(feature, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={makePrediction} disabled={isPredicting || !model?.serializedModel} className="w-full">
                  {isPredicting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    "Make Prediction"
                  )}
                </Button>

                {predictionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{predictionError}</AlertDescription>
                  </Alert>
                )}

                {predictionResult && (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Prediction Result</AlertTitle>
                      <AlertDescription className="font-bold">{predictionResult.prediction}</AlertDescription>
                    </Alert>

                    {predictionResult.probabilities && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Class Probabilities</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Class</TableHead>
                              <TableHead>Probability</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {predictionResult.probabilities.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.class}</TableCell>
                                <TableCell>{item.probability.toFixed(4)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

