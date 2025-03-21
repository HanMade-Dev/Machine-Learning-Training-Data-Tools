"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2 } from "lucide-react"

interface FeatureLabelingProps {
  data: any[]
  columns: string[]
  onLabeled: (labeledData: any[], targetColumn: string, rules: any, isLabeled: boolean) => void
  onNext: () => void
}

interface LabelRule {
  column: string
  ranges: {
    min: number
    max: number
    label: string
  }[]
}

export default function FeatureLabeling({ data, columns, onLabeled, onNext }: FeatureLabelingProps) {
  const [labelingMode, setLabelingMode] = useState<"manual" | "existing">("existing")
  const [targetColumn, setTargetColumn] = useState<string>("")
  const [labelRules, setLabelRules] = useState<LabelRule[]>([])
  const [labeledData, setLabeledData] = useState<any[]>([])
  const [isLabeled, setIsLabeled] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])

  useEffect(() => {
    // Initialize preview data with all rows
    setPreviewData(data)

    // Set default target column if available
    if (columns.length > 0) {
      setTargetColumn(columns[0])
    }
  }, [data, columns])

  const addLabelRule = () => {
    if (columns.length === 0) return

    const newRule: LabelRule = {
      column: columns[0],
      ranges: [{ min: 0, max: 100, label: "Category 1" }],
    }

    setLabelRules([...labelRules, newRule])
  }

  const removeLabelRule = (index: number) => {
    setLabelRules(labelRules.filter((_, i) => i !== index))
  }

  const updateRuleColumn = (ruleIndex: number, column: string) => {
    const updatedRules = [...labelRules]
    updatedRules[ruleIndex].column = column
    setLabelRules(updatedRules)
  }

  const addRangeToRule = (ruleIndex: number) => {
    const updatedRules = [...labelRules]
    const lastRange = updatedRules[ruleIndex].ranges[updatedRules[ruleIndex].ranges.length - 1]

    updatedRules[ruleIndex].ranges.push({
      min: lastRange.max,
      max: lastRange.max + 100,
      label: `Category ${updatedRules[ruleIndex].ranges.length + 1}`,
    })

    setLabelRules(updatedRules)
  }

  const removeRangeFromRule = (ruleIndex: number, rangeIndex: number) => {
    const updatedRules = [...labelRules]
    updatedRules[ruleIndex].ranges = updatedRules[ruleIndex].ranges.filter((_, i) => i !== rangeIndex)
    setLabelRules(updatedRules)
  }

  const updateRange = (ruleIndex: number, rangeIndex: number, field: "min" | "max" | "label", value: any) => {
    const updatedRules = [...labelRules]
    updatedRules[ruleIndex].ranges[rangeIndex][field] = value
    setLabelRules(updatedRules)
  }

  const applyLabeling = () => {
    if (labelingMode === "existing") {
      // If using existing labels, just set the target column
      setLabeledData([...data])
      setIsLabeled(false)
      onLabeled([...data], targetColumn, {}, false)
    } else {
      // Apply manual labeling rules
      const labeled = data.map((row) => {
        const newRow = { ...row }

        // Create a new target column called "Label"
        newRow["Label"] = "Unknown"

        // Apply each rule
        labelRules.forEach((rule) => {
          const value = Number.parseFloat(row[rule.column])

          if (!isNaN(value)) {
            // Find the matching range
            const matchingRange = rule.ranges.find((range) => value >= range.min && value <= range.max)

            if (matchingRange) {
              newRow["Label"] = matchingRange.label
            }
          }
        })

        return newRow
      })

      setLabeledData(labeled)
      setPreviewData(labeled)
      setIsLabeled(true)
      onLabeled(labeled, "Label", labelRules, true)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={labelingMode} onValueChange={(value) => setLabelingMode(value as "manual" | "existing")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Use Existing Labels</TabsTrigger>
          <TabsTrigger value="manual">Create Labels</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Target Column</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-4">
                    <Label htmlFor="target-column">Target Column</Label>
                    <Select value={targetColumn} onValueChange={setTargetColumn}>
                      <SelectTrigger id="target-column">
                        <SelectValue placeholder="Select target column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column} value={column}>
                            {column}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Define Labeling Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {labelRules.map((rule, ruleIndex) => (
                  <div key={ruleIndex} className="p-4 border rounded-md space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Label>Column</Label>
                        <Select value={rule.column} onValueChange={(value) => updateRuleColumn(ruleIndex, value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button variant="ghost" size="icon" onClick={() => removeLabelRule(ruleIndex)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {rule.ranges.map((range, rangeIndex) => (
                        <div key={rangeIndex} className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                            <Label htmlFor={`min-${ruleIndex}-${rangeIndex}`}>Min</Label>
                            <Input
                              id={`min-${ruleIndex}-${rangeIndex}`}
                              type="number"
                              value={range.min}
                              onChange={(e) =>
                                updateRange(ruleIndex, rangeIndex, "min", Number.parseFloat(e.target.value))
                              }
                            />
                          </div>
                          <div className="col-span-3">
                            <Label htmlFor={`max-${ruleIndex}-${rangeIndex}`}>Max</Label>
                            <Input
                              id={`max-${ruleIndex}-${rangeIndex}`}
                              type="number"
                              value={range.max}
                              onChange={(e) =>
                                updateRange(ruleIndex, rangeIndex, "max", Number.parseFloat(e.target.value))
                              }
                            />
                          </div>
                          <div className="col-span-5">
                            <Label htmlFor={`label-${ruleIndex}-${rangeIndex}`}>Label</Label>
                            <Input
                              id={`label-${ruleIndex}-${rangeIndex}`}
                              value={range.label}
                              onChange={(e) => updateRange(ruleIndex, rangeIndex, "label", e.target.value)}
                            />
                          </div>
                          <div className="col-span-1 flex items-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRangeFromRule(ruleIndex, rangeIndex)}
                              disabled={rule.ranges.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button variant="outline" onClick={() => addRangeToRule(ruleIndex)} className="w-full">
                        Add Range
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addLabelRule} className="w-full">
                  Add Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center">
        <Button
          onClick={applyLabeling}
          disabled={
            (labelingMode === "manual" && labelRules.length === 0) || (labelingMode === "existing" && !targetColumn)
          }
        >
          Apply Labeling
        </Button>

        <Button onClick={onNext} disabled={!targetColumn && !isLabeled}>
          Next
        </Button>
      </div>

      {(isLabeled || targetColumn) && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview with Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isLabeled ? (
                      <>
                        {columns.map((column) => (
                          <TableHead key={column}>{column}</TableHead>
                        ))}
                        <TableHead>Label</TableHead>
                      </>
                    ) : (
                      <>
                        {columns.map((column) => (
                          <TableHead key={column} className={column === targetColumn ? "bg-primary/20" : ""}>
                            {column}
                          </TableHead>
                        ))}
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {isLabeled ? (
                        <>
                          {columns.map((column) => (
                            <TableCell key={`${rowIndex}-${column}`}>
                              {row[column] === null || row[column] === undefined ? (
                                <span className="text-gray-400">None</span>
                              ) : (
                                String(row[column])
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="font-medium">{row["Label"]}</TableCell>
                        </>
                      ) : (
                        <>
                          {columns.map((column) => (
                            <TableCell
                              key={`${rowIndex}-${column}`}
                              className={column === targetColumn ? "bg-primary/10" : ""}
                            >
                              {row[column] === null || row[column] === undefined ? (
                                <span className="text-gray-400">None</span>
                              ) : (
                                String(row[column])
                              )}
                            </TableCell>
                          ))}
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

