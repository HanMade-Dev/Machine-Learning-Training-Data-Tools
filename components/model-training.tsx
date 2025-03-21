"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface ModelTrainingProps {
  data: any[]
  columns: string[]
  targetColumn: string
  isLabeled: boolean
  onModelTrained: (model: any, evaluation: any) => void
  onNext: () => void
}

export default function ModelTraining({
  data,
  columns,
  targetColumn,
  isLabeled,
  onModelTrained,
  onNext,
}: ModelTrainingProps) {
  const [algorithm, setAlgorithm] = useState<string>("decision_tree")
  const [testSize, setTestSize] = useState<number>(20)
  const [randomState, setRandomState] = useState<number>(42)
  const [hyperparameters, setHyperparameters] = useState<any>({
    decision_tree: {
      max_depth: 5,
      min_samples_split: 2,
    },
    random_forest: {
      n_estimators: 100,
      max_depth: 5,
    },
    svm: {
      C: 1.0,
      kernel: "rbf",
    },
    knn: {
      n_neighbors: 5,
    },
    naive_bayes: {},
  })

  const [isTraining, setIsTraining] = useState<boolean>(false)
  const [trainingProgress, setTrainingProgress] = useState<number>(0)
  const [model, setModel] = useState<any>(null)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [featureColumns, setFeatureColumns] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [useOversampling, setUseOversampling] = useState<boolean>(false)

  useEffect(() => {
    if (columns.length > 0 && targetColumn) {
      setFeatureColumns(columns.filter((col) => col !== targetColumn))
    }
  }, [columns, targetColumn])

  const updateHyperparameter = (algo: string, param: string, value: any) => {
    setHyperparameters({
      ...hyperparameters,
      [algo]: {
        ...hyperparameters[algo],
        [param]: value,
      },
    })
  }

  const trainModel = async () => {
    if (!targetColumn || featureColumns.length === 0) {
      return
    }

    setIsTraining(true)
    setTrainingProgress(0)
    setError(null)

    try {
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 200)

      const X = data.map((row) => {
        const features: number[] = []
        featureColumns.forEach((col) => {
          const val = Number.parseFloat(row[col])
          features.push(isNaN(val) ? 0 : val)
        })
        return features
      })

      const y = data.map((row) => row[targetColumn])

      const response = await fetch("/api/train-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          X,
          y,
          algorithm,
          hyperparameters: hyperparameters[algorithm],
          testSize: testSize / 100,
          randomState,
          useOversampling,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to train model")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Unknown error during model training")
      }

      clearInterval(progressInterval)
      setTrainingProgress(100)

      const trainedModel = {
        type: algorithm,
        hyperparameters: hyperparameters[algorithm],
        testSize: testSize / 100,
        randomState,
        ...result.model,
      }

      setModel(trainedModel)
      setEvaluation(result.evaluation)
      onModelTrained(trainedModel, result.evaluation)
    } catch (error: any) {
      console.error("Error training model:", error)
      setError(error.message || "An error occurred during model training")
      setTrainingProgress(0)
    } finally {
      setIsTraining(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Algorithm</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={algorithm} onValueChange={setAlgorithm}>
            <SelectTrigger>
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="decision_tree">Decision Tree</SelectItem>
              <SelectItem value="random_forest">Random Forest</SelectItem>
              <SelectItem value="svm">Support Vector Machine</SelectItem>
              <SelectItem value="knn">K-Nearest Neighbors</SelectItem>
              <SelectItem value="naive_bayes">Naive Bayes</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Test Size: {testSize}%</Label>
                <span className="text-sm text-gray-500">Train: {100 - testSize}%</span>
              </div>
              <Slider value={[testSize]} min={10} max={40} step={5} onValueChange={(value) => setTestSize(value[0])} />
            </div>

            <div className="space-y-2">
              <Label>Random State: {randomState}</Label>
              <Slider
                value={[randomState]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setRandomState(value[0])}
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="use-oversampling"
                checked={useOversampling}
                onCheckedChange={(checked) => setUseOversampling(!!checked)}
              />
              <div>
                <Label htmlFor="use-oversampling">Use Oversampling (SMOTE)</Label>
                <p className="text-sm text-gray-500">
                  Balance classes by generating synthetic samples for minority classes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hyperparameters</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={algorithm}>
            <TabsContent value="decision_tree" className="space-y-4">
              <div className="space-y-2">
                <Label>Max Depth: {hyperparameters.decision_tree.max_depth}</Label>
                <Slider
                  value={[hyperparameters.decision_tree.max_depth]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => updateHyperparameter("decision_tree", "max_depth", value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Min Samples Split: {hyperparameters.decision_tree.min_samples_split}</Label>
                <Slider
                  value={[hyperparameters.decision_tree.min_samples_split]}
                  min={2}
                  max={10}
                  step={1}
                  onValueChange={(value) => updateHyperparameter("decision_tree", "min_samples_split", value[0])}
                />
              </div>
            </TabsContent>

            <TabsContent value="random_forest" className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Estimators: {hyperparameters.random_forest.n_estimators}</Label>
                <Slider
                  value={[hyperparameters.random_forest.n_estimators]}
                  min={10}
                  max={200}
                  step={10}
                  onValueChange={(value) => updateHyperparameter("random_forest", "n_estimators", value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Depth: {hyperparameters.random_forest.max_depth}</Label>
                <Slider
                  value={[hyperparameters.random_forest.max_depth]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => updateHyperparameter("random_forest", "max_depth", value[0])}
                />
              </div>
            </TabsContent>

            <TabsContent value="svm" className="space-y-4">
              <div className="space-y-2">
                <Label>C (Regularization): {hyperparameters.svm.C}</Label>
                <Slider
                  value={[hyperparameters.svm.C * 10]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(value) => updateHyperparameter("svm", "C", value[0] / 10)}
                />
              </div>

              <div className="space-y-2">
                <Label>Kernel</Label>
                <Select
                  value={hyperparameters.svm.kernel}
                  onValueChange={(value) => updateHyperparameter("svm", "kernel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="poly">Polynomial</SelectItem>
                    <SelectItem value="rbf">RBF</SelectItem>
                    <SelectItem value="sigmoid">Sigmoid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="knn" className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Neighbors: {hyperparameters.knn.n_neighbors}</Label>
                <Slider
                  value={[hyperparameters.knn.n_neighbors]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => updateHyperparameter("knn", "n_neighbors", value[0])}
                />
              </div>
            </TabsContent>

            <TabsContent value="naive_bayes">
              <p className="text-sm text-gray-500 py-4">Naive Bayes has no hyperparameters to tune.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button onClick={trainModel} disabled={isTraining || !targetColumn} className="flex items-center gap-2">
          {isTraining ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Training...
            </>
          ) : (
            "Train Model"
          )}
        </Button>

        <Button onClick={onNext} disabled={!model || !evaluation}>
          Next
        </Button>
      </div>

      {isTraining && (
        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={trainingProgress} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">
              {trainingProgress < 100 ? "Training in progress..." : "Training complete!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

