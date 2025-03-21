"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileUp, FileX } from "lucide-react"
import { useDropzone } from "react-dropzone"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface FileUploadProps {
  onDataLoaded: (data: any[], columns: string[]) => void
  onNext: () => void
}

export default function FileUpload({ onDataLoaded, onNext }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [headerRow, setHeaderRow] = useState<number>(1)
  const [hasCustomHeader, setHasCustomHeader] = useState<boolean>(false)
  const [rawPreview, setRawPreview] = useState<string[][]>([])
  const [showRawPreview, setShowRawPreview] = useState<boolean>(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    setError(null)
    setDataLoaded(false)

    // Generate a preview of the first file to help user identify header row
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]

      if (file.name.endsWith(".csv")) {
        file.text().then((text) => {
          const result = Papa.parse(text, { header: false, preview: 10 })
          if (result.data && result.data.length > 0) {
            setRawPreview(result.data as string[][])
            setShowRawPreview(true)
          }
        })
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        file.arrayBuffer().then((buffer) => {
          const workbook = XLSX.read(buffer)
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", range: 0 })
          if (jsonData && jsonData.length > 0) {
            setRawPreview(jsonData as string[][])
            setShowRawPreview(true)
          }
        })
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: true,
  })

  const processFiles = async () => {
    if (files.length === 0) {
      setError("Please upload at least one file")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const allData: any[] = []
      let columns: string[] = []

      for (const file of files) {
        if (file.name.endsWith(".csv")) {
          // Process CSV
          const text = await file.text()

          // First parse without headers to get raw data
          const rawResult = Papa.parse(text, { header: false, skipEmptyLines: true })

          if (rawResult.data && rawResult.data.length > 0) {
            const rawData = rawResult.data as string[][]

            // Extract header row based on user selection
            const headerRowIndex = hasCustomHeader ? headerRow - 1 : 0

            if (headerRowIndex >= rawData.length) {
              throw new Error(`Header row ${headerRow} exceeds the number of rows in the file`)
            }

            const headers = rawData[headerRowIndex]

            // Clean up header names - replace empty headers with column indices
            const cleanHeaders = headers.map((header, index) => {
              const trimmed = header.trim()
              return trimmed === "" ? `Column_${index + 1}` : trimmed
            })

            // Process data rows (all rows after the header)
            const dataRows = rawData.slice(headerRowIndex + 1)

            // Convert to objects with proper headers
            const processedData = dataRows.map((row) => {
              const obj: Record<string, any> = {}
              cleanHeaders.forEach((header, index) => {
                obj[header] = index < row.length ? row[index] : null
              })
              return obj
            })

            // Set columns if not already set
            if (columns.length === 0) {
              columns = cleanHeaders
            }

            allData.push(...processedData)
          }
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          // Process Excel
          const arrayBuffer = await file.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer)

          // Get the first worksheet
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]

          // First get raw data with headers as array
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

          if (rawData && rawData.length > 0) {
            // Extract header row based on user selection
            const headerRowIndex = hasCustomHeader ? headerRow - 1 : 0

            if (headerRowIndex >= rawData.length) {
              throw new Error(`Header row ${headerRow} exceeds the number of rows in the file`)
            }

            const headers = rawData[headerRowIndex] as string[]

            // Clean up header names - replace empty headers with column indices
            const cleanHeaders = headers.map((header, index) => {
              const headerStr = String(header || "").trim()
              return headerStr === "" ? `Column_${index + 1}` : headerStr
            })

            // Process data rows (all rows after the header)
            const dataRows = rawData.slice(headerRowIndex + 1) as any[][]

            // Convert to objects with proper headers
            const processedData = dataRows.map((row) => {
              const obj: Record<string, any> = {}
              cleanHeaders.forEach((header, index) => {
                obj[header] = index < row.length ? row[index] : null
              })
              return obj
            })

            // Set columns if not already set
            if (columns.length === 0) {
              columns = cleanHeaders
            }

            allData.push(...processedData)
          }
        }
      }

      if (allData.length === 0) {
        throw new Error("No valid data found in the uploaded files")
      }

      onDataLoaded(allData, columns)
      setDataLoaded(true)
      setShowRawPreview(false)
    } catch (err: any) {
      setError(err.message || "Error processing files")
    } finally {
      setLoading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setDataLoaded(false)
    setShowRawPreview(false)
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">Drag & drop CSV or Excel files here, or click to select files</p>
        <p className="text-xs text-gray-500 mt-1">Supported formats: .csv, .xlsx, .xls</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Uploaded Files ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={index} className="p-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <FileUp className="h-5 w-5 text-gray-500" />
                  <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-8 w-8">
                  <FileX className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showRawPreview && rawPreview.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">File Preview (First 10 rows)</h3>
          <div className="border rounded-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {rawPreview.slice(0, 10).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`${rowIndex === headerRow - 1 && hasCustomHeader ? "bg-primary/10 font-medium" : ""}`}
                  >
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 w-10 border-r">{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {String(cell || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="custom-header"
              checked={hasCustomHeader}
              onCheckedChange={(checked) => setHasCustomHeader(!!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="custom-header" className="text-sm font-medium">
                Headers are not in the first row
              </Label>
              <p className="text-xs text-muted-foreground">Check this if your column headers are in a different row</p>
            </div>
          </div>

          {hasCustomHeader && (
            <div className="flex items-center space-x-4">
              <div className="w-32">
                <Label htmlFor="header-row" className="text-sm">
                  Header Row
                </Label>
                <Input
                  id="header-row"
                  type="number"
                  min="1"
                  max={rawPreview.length}
                  value={headerRow}
                  onChange={(e) => setHeaderRow(Number.parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-6">Row {headerRow} will be used as column headers</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <div className="flex justify-end space-x-4">
        <Button onClick={processFiles} disabled={files.length === 0 || loading} className="flex items-center gap-2">
          {loading ? "Processing..." : "Process Files"}
        </Button>
        <Button onClick={onNext} disabled={!dataLoaded} variant="default">
          Next
        </Button>
      </div>
    </div>
  )
}

