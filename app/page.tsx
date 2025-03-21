"use client"

import { useState, useCallback, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FileUpload from "@/components/file-upload"
import DataPreview from "@/components/data-preview"
import DataCleaning from "@/components/data-cleaning"
import FeatureLabeling from "@/components/feature-labeling"
import ModelTraining from "@/components/model-training"
import ModelEvaluation from "@/components/model-evaluation"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import AboutModal from "@/components/about-modal"

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [data, setData] = useState<any[]>([])
  const [processedData, setProcessedData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [cleanedData, setCleanedData] = useState<any[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [labeledData, setLabeledData] = useState<any[]>([])
  const [targetColumn, setTargetColumn] = useState<string>("")
  const [model, setModel] = useState<any>(null)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [isLabeled, setIsLabeled] = useState(false)
  const [labelingRules, setLabelingRules] = useState<any>({})
  const [modelFormat, setModelFormat] = useState<string>("pkl")

  // Use this to ensure we're rendering on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const nextStep = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  const handleSaveModel = useCallback(() => {
    if (!model) return

    if (modelFormat === "pkl" && model.serializedModel) {
      // For pickle format, save the actual serialized model
      const modelBlob = new Blob([atob(model.serializedModel)], { type: "application/octet-stream" })
      const modelUrl = URL.createObjectURL(modelBlob)
      const a = document.createElement("a")
      a.href = modelUrl
      a.download = `ml_model.pkl`
      a.click()
    } else {
      // For other formats, create a representation
      let fileExtension = ".json"
      let mimeType = "application/json"
      let content = JSON.stringify(
        {
          type: model.type,
          hyperparameters: model.hyperparameters,
          testSize: model.testSize,
          randomState: model.randomState,
          featureImportance: model.featureImportance,
          coefficients: model.coefficients,
          intercept: model.intercept,
        },
        null,
        2,
      )

      if (modelFormat === "xml") {
        fileExtension = ".xml"
        mimeType = "application/xml"
        content = `<model>
  <type>${model.type}</type>
  <hyperparameters>${JSON.stringify(model.hyperparameters)}</hyperparameters>
  <testSize>${model.testSize}</testSize>
  <randomState>${model.randomState}</randomState>
</model>`
      }

      const modelBlob = new Blob([content], { type: mimeType })
      const modelUrl = URL.createObjectURL(modelBlob)
      const a = document.createElement("a")
      a.href = modelUrl
      a.download = `ml_model${fileExtension}`
      a.click()
    }
  }, [model, modelFormat])

  const handleSaveReport = useCallback(() => {
    if (!evaluation) return

    const reportContent = `
# Machine Learning Training Data Report
Date: ${new Date().toLocaleString()}

## Model Information
- Model Type: ${evaluation.modelType}
- Features: ${selectedColumns.filter((col) => col !== targetColumn).join(", ")}
- Target: ${targetColumn}

## Performance Metrics
- Accuracy: ${evaluation.accuracy.toFixed(4)}
- Precision: ${evaluation.precision.toFixed(4)}
- Recall: ${evaluation.recall.toFixed(4)}
- F1 Score: ${evaluation.f1Score.toFixed(4)}

## Confusion Matrix
${evaluation.confusionMatrix.map((row: number[]) => row.join("\t")).join("\n")}
`

    const reportBlob = new Blob([reportContent], { type: "text/plain" })
    const reportUrl = URL.createObjectURL(reportBlob)
    const a = document.createElement("a")
    a.href = reportUrl
    a.download = "ml_training_report.txt"
    a.click()
  }, [evaluation, selectedColumns, targetColumn])

  const handleColumnsSelected = useCallback((cols: string[], renamedData: any[]) => {
    setSelectedColumns(cols)
    setProcessedData(renamedData)
  }, [])

  const handleDataLoaded = useCallback((loadedData: any[], loadedColumns: string[]) => {
    setData(loadedData)
    setProcessedData(loadedData)
    setColumns(loadedColumns)
  }, [])

  const handleDataCleaned = useCallback((cleaned: any[]) => {
    setCleanedData(cleaned)
  }, [])

  const handleLabeled = useCallback((labeled: any[], target: string, rules: any, labeled_status: boolean) => {
    setLabeledData(labeled)
    setTargetColumn(target)
    setLabelingRules(rules)
    setIsLabeled(labeled_status)
  }, [])

  const handleModelTrained = useCallback((trainedModel: any, evalResults: any) => {
    setModel(trainedModel)
    setEvaluation(evalResults)
  }, [])

  const handleModelFormatChange = useCallback((format: string) => {
    setModelFormat(format)
  }, [])

  const featureColumns = selectedColumns.filter((col) => col !== targetColumn)

  if (!isClient) {
    return (
      <div className="container mx-auto py-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Machine Learning Training Data Tools</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center">Machine Learning Training Data Tools</h1>
        <AboutModal />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
          <TabsTrigger value="labeling">Labeling</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Dataset</CardTitle>
              <CardDescription>Upload CSV or Excel files containing your dataset</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onDataLoaded={handleDataLoaded} onNext={() => nextStep("preview")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>Preview your dataset and select columns for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <DataPreview
                data={data}
                columns={columns}
                onColumnsSelected={handleColumnsSelected}
                onNext={() => nextStep("cleaning")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning">
          <Card>
            <CardHeader>
              <CardTitle>Data Cleaning</CardTitle>
              <CardDescription>Clean and normalize your data</CardDescription>
            </CardHeader>
            <CardContent>
              <DataCleaning
                data={processedData}
                selectedColumns={selectedColumns}
                onDataCleaned={handleDataCleaned}
                onNext={() => nextStep("labeling")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labeling">
          <Card>
            <CardHeader>
              <CardTitle>Feature Labeling</CardTitle>
              <CardDescription>Label your data or select target column</CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureLabeling
                data={cleanedData}
                columns={selectedColumns}
                onLabeled={handleLabeled}
                onNext={() => nextStep("training")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>Model Training</CardTitle>
              <CardDescription>Configure and train your machine learning model</CardDescription>
            </CardHeader>
            <CardContent>
              <ModelTraining
                data={labeledData}
                columns={selectedColumns}
                targetColumn={targetColumn}
                isLabeled={isLabeled}
                onModelTrained={handleModelTrained}
                onNext={() => nextStep("evaluation")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation">
          <Card>
            <CardHeader>
              <CardTitle>Model Evaluation</CardTitle>
              <CardDescription>Review model performance and export results</CardDescription>
            </CardHeader>
            <CardContent>
              {evaluation ? (
                <div>
                  <ModelEvaluation
                    evaluation={evaluation}
                    model={model}
                    featureColumns={featureColumns}
                    modelFormat={modelFormat}
                    onModelFormatChange={handleModelFormatChange}
                  />

                  <div className="flex justify-end gap-4 mt-8">
                    <Button onClick={handleSaveReport} className="flex items-center gap-2">
                      <Download size={16} />
                      Save Report
                    </Button>
                    <Button onClick={handleSaveModel} className="flex items-center gap-2">
                      <Download size={16} />
                      Save Model
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No evaluation results available. Please complete the training step first.</p>
                  <Button onClick={() => nextStep("training")} className="mt-4">
                    Go to Training
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

