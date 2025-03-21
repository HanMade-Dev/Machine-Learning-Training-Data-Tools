"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, FileUp, FileX, Download, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useDropzone } from "react-dropzone"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import Papa from "papaparse"
import * as XLSX from "xlsx"

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [dataFile, setDataFile] = useState<File | null>(null)
  const [model, setModel] = useState<any>(null)
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [predictionStats, setPredictionStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [missingFeatures, setMissingFeatures] = useState<string[]>([])

  const modelDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setModelFile(acceptedFiles[0])
        readModelFile(acceptedFiles[0])
      }
    },
    accept: {
      "application/json": [".json"],
      "application/octet-stream": [".pkl"],
    },
    multiple: false,
  })

  const dataDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setDataFile(acceptedFiles[0])
        readDataFile(acceptedFiles[0])
      }
    },
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  })

  const readModelFile = async (file: File) => {
    try {
      setError(null)
      setWarning(null)

      if (file.name.endsWith(".json")) {
        // Handle JSON model file
        const text = await file.text()
        const modelData = JSON.parse(text)
        setModel(modelData)
      } else if (file.name.endsWith(".pkl")) {
        // For PKL files, we would normally use a server endpoint to load them
        // Since we can't actually load PKL files in the browser, we'll simulate it

        // Simulate a model loaded from PKL
        const simulatedModel = {
          id: `model-${Date.now()}`,
          type: "random_forest", // Simulated model type
          features: ["feature1", "feature2", "feature3"], // Simulated features
          targetColumn: "target",
          classes: ["Class A", "Class B", "Class C"], // Simulated classes (3 classes)
          format: "pkl",
          createdAt: new Date().toISOString(),
        }

        setModel(simulatedModel)
        setWarning("PKL model loaded (simulated). In a production environment, this would be processed server-side.")
      } else {
        throw new Error("Unsupported model format. Please use .json or .pkl files.")
      }
    } catch (err: any) {
      setError(`Error reading model file: ${err.message}`)
      setModel(null)
    }
  }

  const readDataFile = async (file: File) => {
    try {
      setError(null)
      setWarning(null)

      let parsedData: any[] = []

      if (file.name.endsWith(".csv")) {
        // Process CSV file
        const text = await file.text()
        const result = Papa.parse(text, { header: true, skipEmptyLines: true })

        if (result.data && result.data.length > 0) {
          parsedData = result.data as any[]
        } else {
          throw new Error("No valid data found in CSV file")
        }
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Process Excel file
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)

        // Get the first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null })

        if (jsonData && jsonData.length > 0) {
          parsedData = jsonData as any[]
        } else {
          throw new Error("No valid data found in Excel file")
        }
      } else {
        throw new Error("Unsupported file format")
      }

      setData(parsedData)
      setColumns(Object.keys(parsedData[0] || {}))

      // If model is already loaded, check for feature compatibility
      if (model && model.features) {
        checkFeatureCompatibility(parsedData, model.features)
      }
    } catch (err: any) {
      setError(`Error reading data file: ${err.message}`)
      setData([])
      setColumns([])
    }
  }

  // Check if the uploaded data has all the features required by the model
  const checkFeatureCompatibility = (data: any[], modelFeatures: string[] | undefined) => {
    if (!modelFeatures || modelFeatures.length === 0) {
      // If no features are specified in the model, use all columns from the data
      setFilteredData(data)
      setMissingFeatures([])
      return
    }

    const dataColumns = Object.keys(data[0] || {})
    const missing = modelFeatures.filter((feature) => !dataColumns.includes(feature))

    setMissingFeatures(missing)

    if (missing.length > 0) {
      setWarning(`The uploaded data is missing ${missing.length} features required by the model: ${missing.join(", ")}`)
    } else {
      // Filter data to only include model features
      const filtered = data.map((row) => {
        const newRow: any = {}
        modelFeatures.forEach((feature) => {
          newRow[feature] = row[feature]
        })
        return newRow
      })

      setFilteredData(filtered)
    }
  }

  // Effect to check feature compatibility when either model or data changes
  useEffect(() => {
    if (model && data.length > 0) {
      checkFeatureCompatibility(data, model.features)
    }
  }, [model, data])

  const analyzeData = () => {
    if (!model || data.length === 0) {
      setError("Please upload both model and data files for analysis.")
      return
    }

    if (missingFeatures.length > 0) {
      setError("Cannot analyze data: missing required features. Please upload a compatible dataset.")
      return
    }

    // Use filtered data that only contains the model's features
    const dataToAnalyze = filteredData.length > 0 ? filteredData : data

    // Get the number of classes from the model
    const classes = model.classes || ["Class A", "Class B"]

    // Mock prediction process based on the model's classes
    const mockPredictions = dataToAnalyze.map((row) => {
      // Generate a random prediction from the available classes
      const randomIndex = Math.floor(Math.random() * classes.length)
      const predictionClass = classes[randomIndex]
      const confidence = 0.7 + Math.random() * 0.3 // Random confidence between 0.7 and 1.0

      return {
        ...row,
        prediction: predictionClass,
        confidence: confidence,
      }
    })

    setPredictions(mockPredictions)

    // Calculate prediction statistics
    const classCounts = classes.reduce((acc: any, className: string) => {
      acc[className] = mockPredictions.filter((p) => p.prediction === className).length
      return acc
    }, {})

    // Prepare data for pie chart
    const countData = Object.entries(classCounts).map(([name, value]) => ({
      name,
      value,
    }))

    // Prepare data for feature comparison chart
    const features =
      model.features ||
      Object.keys(dataToAnalyze[0] || {}).filter((key) => key !== "prediction" && key !== "confidence")

    const featureData = features.map((feature: string) => {
      const featureStats: any = {
        name: feature,
      }

      // Calculate average value for each class
      classes.forEach((className: string) => {
        const classRows = mockPredictions.filter((p) => p.prediction === className)
        if (classRows.length > 0) {
          const sum = classRows.reduce((sum, row) => sum + Number(row[feature] || 0), 0)
          featureStats[className] = sum / classRows.length
        } else {
          featureStats[className] = 0
        }
      })

      return featureStats
    })

    setPredictionStats({
      counts: countData,
      features: featureData,
    })

    setActiveTab("results")
  }

  const exportResults = () => {
    if (!predictions || predictions.length === 0) return

    const csvContent = [
      [...Object.keys(predictions[0]).filter((key) => key !== "confidence"), "confidence"].join(","),
      ...predictions.map((row) => {
        const values = Object.entries(row)
          .filter(([key]) => key !== "confidence")
          .map(([_, value]) => value)
        return [...values, row.confidence].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "prediction_results.csv"
    a.click()
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"]

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Analysis & Classification</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Model</CardTitle>
                <CardDescription>Upload a trained machine learning model (.json or .pkl)</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...modelDropzone.getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                    modelDropzone.isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
                  }`}
                >
                  <input {...modelDropzone.getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Drag & drop model file here, or click to select file</p>
                  <p className="text-xs text-gray-500 mt-1">Supported formats: .json, .pkl</p>
                </div>

                {modelFile && (
                  <div className="mt-4">
                    <Card className="p-3 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <FileUp className="h-5 w-5 text-gray-500" />
                        <span className="text-sm truncate max-w-[250px]">{modelFile.name}</span>
                        <span className="text-xs text-gray-500">{(modelFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setModelFile(null)
                          setModel(null)
                          setMissingFeatures([])
                        }}
                        className="h-8 w-8"
                      >
                        <FileX className="h-4 w-4" />
                      </Button>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload Data</CardTitle>
                <CardDescription>Upload data for analysis (.csv, .xlsx, .xls)</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...dataDropzone.getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                    dataDropzone.isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
                  }`}
                >
                  <input {...dataDropzone.getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Drag & drop data file here, or click to select file</p>
                  <p className="text-xs text-gray-500 mt-1">Supported formats: .csv, .xlsx, .xls</p>
                </div>

                {dataFile && (
                  <div className="mt-4">
                    <Card className="p-3 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <FileUp className="h-5 w-5 text-gray-500" />
                        <span className="text-sm truncate max-w-[250px]">{dataFile.name}</span>
                        <span className="text-xs text-gray-500">{(dataFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDataFile(null)
                          setData([])
                          setColumns([])
                          setFilteredData([])
                          setMissingFeatures([])
                        }}
                        className="h-8 w-8"
                      >
                        <FileX className="h-4 w-4" />
                      </Button>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {warning && (
            <Alert className="mt-4" variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setActiveTab("configure")} disabled={!model || data.length === 0}>
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="configure">
          <Card>
            <CardHeader>
              <CardTitle>Configure Analysis</CardTitle>
              <CardDescription>Review model and data compatibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Model Information</h3>
                  {model && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 border rounded-md">
                        <span className="text-sm font-medium">Model Type:</span>
                        <p className="mt-1">{model.type}</p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <span className="text-sm font-medium">Format:</span>
                        <p className="mt-1">{model.format || "JSON"}</p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <span className="text-sm font-medium">Classes:</span>
                        <p className="mt-1">{model.classes ? model.classes.length : 2}</p>
                      </div>
                      <div className="p-3 border rounded-md col-span-3">
                        <span className="text-sm font-medium">Required Features:</span>
                        <p className="mt-1 text-sm">
                          {model.features && model.features.length > 0
                            ? model.features.join(", ")
                            : "All columns will be used"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {missingFeatures.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing Features</AlertTitle>
                    <AlertDescription>
                      The uploaded data is missing these required features: {missingFeatures.join(", ")}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Data Preview (Filtered for Model Features)</h3>
                    <ScrollArea className="h-[300px] border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {model && model.features && model.features.length > 0
                              ? model.features.map((feature: string) => (
                                  <TableHead key={feature} className="bg-primary/10">
                                    {feature}
                                  </TableHead>
                                ))
                              : columns.map((column) => <TableHead key={column}>{column}</TableHead>)}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {(model && model.features && model.features.length > 0 ? model.features : columns).map(
                                (column) => (
                                  <TableCell key={`${rowIndex}-${column}`}>
                                    {row[column] === null || row[column] === undefined ? (
                                      <span className="text-gray-400">None</span>
                                    ) : (
                                      String(row[column])
                                    )}
                                  </TableCell>
                                ),
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setActiveTab("upload")}>
              Back
            </Button>
            <Button onClick={analyzeData} disabled={missingFeatures.length > 0}>
              Analyze Data
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="results">
          {predictions.length > 0 && predictionStats ? (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Prediction Results</CardTitle>
                  <CardDescription>Classification results for your data</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {model && model.features && model.features.length > 0
                            ? model.features.map((feature: string) => <TableHead key={feature}>{feature}</TableHead>)
                            : Object.keys(predictions[0])
                                .filter((key) => key !== "prediction" && key !== "confidence")
                                .map((column) => <TableHead key={column}>{column}</TableHead>)}
                          <TableHead className="bg-primary/10">Prediction</TableHead>
                          <TableHead className="bg-primary/10">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {predictions.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {(model && model.features && model.features.length > 0
                              ? model.features
                              : Object.keys(row).filter((key) => key !== "prediction" && key !== "confidence")
                            ).map((column) => (
                              <TableCell key={`${rowIndex}-${column}`}>
                                {row[column] === null || row[column] === undefined ? (
                                  <span className="text-gray-400">None</span>
                                ) : (
                                  String(row[column])
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="font-medium">{row.prediction}</TableCell>
                            <TableCell>{(row.confidence * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Prediction Distribution</CardTitle>
                    <CardDescription>Distribution of predicted classes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={predictionStats.counts}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {predictionStats.counts.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} records`, "Count"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feature Comparison</CardTitle>
                    <CardDescription>Average feature values by predicted class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={predictionStats.features}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {model && model.classes ? (
                            model.classes.map((className: string, index: number) => (
                              <Bar key={className} dataKey={className} fill={COLORS[index % COLORS.length]} />
                            ))
                          ) : (
                            <>
                              <Bar dataKey="Class A" fill="#0088FE" />
                              <Bar dataKey="Class B" fill="#00C49F" />
                            </>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("configure")}>
                  Back
                </Button>
                <Button onClick={exportResults} className="flex items-center gap-2">
                  <Download size={16} />
                  Export Results
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p>No analysis results available. Please complete the analysis first.</p>
              <Button onClick={() => setActiveTab("configure")} className="mt-4">
                Go to Configure
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

