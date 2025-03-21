"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DataCleaningProps {
  data: any[]
  selectedColumns: string[]
  onDataCleaned: (cleanedData: any[]) => void
  onNext: () => void
}

export default function DataCleaning({ data, selectedColumns, onDataCleaned, onNext }: DataCleaningProps) {
  const [cleaningStrategy, setCleaningStrategy] = useState<
    "remove_rows" | "fill_mean" | "fill_median" | "fill_mode" | "fill_zero"
  >("remove_rows")
  const [cleanedData, setCleanedData] = useState<any[]>([])
  const [missingValueStats, setMissingValueStats] = useState<{ [key: string]: number }>({})
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isCleaned, setIsCleaned] = useState(false)

  useEffect(() => {
    if (!data || data.length === 0 || !selectedColumns || selectedColumns.length === 0) {
      return
    }

    // Calculate missing value statistics
    const stats: { [key: string]: number } = {}

    selectedColumns.forEach((column) => {
      const missingCount = data.filter(
        (row) =>
          row[column] === null ||
          row[column] === undefined ||
          row[column] === "" ||
          row[column] === "None" ||
          (typeof row[column] === "string" && row[column].toLowerCase() === "none"),
      ).length

      stats[column] = missingCount
    })

    setMissingValueStats(stats)

    // Initialize preview data with all rows
    setPreviewData(data)
  }, [data, selectedColumns])

  const cleanData = () => {
    if (!data || data.length === 0) {
      return
    }

    let processed = [...data]

    // Filter to only include selected columns
    processed = processed.map((row) => {
      const newRow: any = {}
      selectedColumns.forEach((col) => {
        newRow[col] = row[col]
      })
      return newRow
    })

    if (cleaningStrategy === "remove_rows") {
      // Remove rows with missing values in any selected column
      processed = processed.filter((row) => {
        return !selectedColumns.some(
          (col) =>
            row[col] === null ||
            row[col] === undefined ||
            row[col] === "" ||
            row[col] === "None" ||
            (typeof row[col] === "string" && row[col].toLowerCase() === "none"),
        )
      })
    } else {
      // For each column, calculate the replacement value based on strategy
      selectedColumns.forEach((column) => {
        // Get all non-null values for this column
        const validValues = processed
          .map((row) => row[column])
          .filter(
            (val) =>
              val !== null &&
              val !== undefined &&
              val !== "" &&
              val !== "None" &&
              !(typeof val === "string" && val.toLowerCase() === "none"),
          )
          .map((val) => (typeof val === "string" ? Number.parseFloat(val) : val))
          .filter((val) => !isNaN(val))

        let replacementValue: any = 0

        if (cleaningStrategy === "fill_mean" && validValues.length > 0) {
          // Calculate mean
          replacementValue = validValues.reduce((sum, val) => sum + val, 0) / validValues.length
        } else if (cleaningStrategy === "fill_median" && validValues.length > 0) {
          // Calculate median
          const sorted = [...validValues].sort((a, b) => a - b)
          const mid = Math.floor(sorted.length / 2)
          replacementValue = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
        } else if (cleaningStrategy === "fill_mode" && validValues.length > 0) {
          // Calculate mode
          const counts = validValues.reduce((acc: { [key: string]: number }, val) => {
            const key = String(val)
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})

          let maxCount = 0
          let mode = validValues[0]

          Object.entries(counts).forEach(([value, count]) => {
            if (count > maxCount) {
              maxCount = count
              mode = Number.parseFloat(value)
            }
          })

          replacementValue = mode
        } else if (cleaningStrategy === "fill_zero") {
          replacementValue = 0
        }

        // Replace missing values with the calculated replacement
        processed = processed.map((row) => {
          const newRow = { ...row }
          if (
            newRow[column] === null ||
            newRow[column] === undefined ||
            newRow[column] === "" ||
            newRow[column] === "None" ||
            (typeof newRow[column] === "string" && newRow[column].toLowerCase() === "none")
          ) {
            newRow[column] = replacementValue
          }
          return newRow
        })
      })
    }

    setCleanedData(processed)
    setPreviewData(processed)
    onDataCleaned(processed)
    setIsCleaned(true)
  }

  return (
    <div className="space-y-6">
      {data && data.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Missing Value Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedColumns.map((column) => (
                  <div key={column} className="flex flex-col p-4 border rounded-md">
                    <span className="text-sm font-medium">{column}</span>
                    <div className="flex items-center mt-2">
                      <span className="text-2xl font-bold">{missingValueStats[column] || 0}</span>
                      <Badge variant={missingValueStats[column] > 0 ? "destructive" : "outline"} className="ml-2">
                        {(((missingValueStats[column] || 0) / data.length) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">missing values</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cleaning Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={cleaningStrategy}
                onValueChange={(value) => setCleaningStrategy(value as any)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remove_rows" id="remove_rows" />
                  <Label htmlFor="remove_rows">Remove rows with missing values</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fill_mean" id="fill_mean" />
                  <Label htmlFor="fill_mean">Fill missing values with mean</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fill_median" id="fill_median" />
                  <Label htmlFor="fill_median">Fill missing values with median</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fill_mode" id="fill_mode" />
                  <Label htmlFor="fill_mode">Fill missing values with mode</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fill_zero" id="fill_zero" />
                  <Label htmlFor="fill_zero">Fill missing values with zero</Label>
                </div>
              </RadioGroup>

              <Button onClick={cleanData} className="mt-4">
                Apply Cleaning
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedColumns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {selectedColumns.map((column) => (
                          <TableCell key={`${rowIndex}-${column}`}>
                            {row[column] === null || row[column] === undefined ? (
                              <span className="text-gray-400">None</span>
                            ) : (
                              String(row[column])
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {isCleaned
                ? `Cleaned data: ${cleanedData.length} rows (from original ${data.length})`
                : "Data not cleaned yet"}
            </p>
            <Button onClick={onNext} disabled={!isCleaned}>
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p>No data available. Please go back to the Preview step and select columns.</p>
          <Button onClick={() => onNext()} className="mt-4" variant="outline">
            Go Back
          </Button>
        </div>
      )}
    </div>
  )
}

