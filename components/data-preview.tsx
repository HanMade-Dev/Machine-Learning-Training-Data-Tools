"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"

interface DataPreviewProps {
  data: any[]
  columns: string[]
  onColumnsSelected: (columns: string[], renamedData: any[]) => void
  onNext: () => void
}

export default function DataPreview({ data, columns, onColumnsSelected, onNext }: DataPreviewProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [columnRenames, setColumnRenames] = useState<Record<string, string>>({})
  const [showRenameOptions, setShowRenameOptions] = useState<boolean>(false)
  const [isRenameApplied, setIsRenameApplied] = useState<boolean>(false)
  const [displayedColumns, setDisplayedColumns] = useState<string[]>([])
  const [hasRenameChanges, setHasRenameChanges] = useState<boolean>(false)
  const [initialized, setInitialized] = useState<boolean>(false)

  // Initialize data once on component mount
  useEffect(() => {
    if (initialized) return

    // Initialize with all rows for preview
    setPreviewData(data)

    // By default, select all columns
    setSelectedColumns([...columns])
    setDisplayedColumns([...columns])

    // Initialize column renames with original names
    const initialRenames: Record<string, string> = {}
    columns.forEach((col) => {
      initialRenames[col] = col
    })
    setColumnRenames(initialRenames)

    // Initial data pass to parent - only do this once
    onColumnsSelected([...columns], data)
    setInitialized(true)
  }, [data, columns, onColumnsSelected, initialized])

  // Apply column renames and update parent
  const applyColumnRenames = useCallback(() => {
    // Create a mapping of original column names to new names
    const columnMapping: Record<string, string> = {}
    Object.keys(columnRenames).forEach((originalCol) => {
      if (columnRenames[originalCol] !== originalCol) {
        columnMapping[originalCol] = columnRenames[originalCol]
      }
    })

    // Create new data with renamed columns
    const renamedData = data.map((row) => {
      const newRow: Record<string, any> = {}
      Object.keys(row).forEach((key) => {
        const newKey = columnMapping[key] || key
        newRow[newKey] = row[key]
      })
      return newRow
    })

    // Update displayed columns
    const newDisplayedColumns = columns.map((col) => columnRenames[col] || col)
    setDisplayedColumns(newDisplayedColumns)

    // Update selected columns with new names
    const newSelectedColumns = selectedColumns.map((col) => columnRenames[col] || col)

    // Update parent component with both selected columns and renamed data
    onColumnsSelected(newSelectedColumns, renamedData)

    setIsRenameApplied(true)
    setHasRenameChanges(false)
    setShowRenameOptions(false)
  }, [columnRenames, columns, data, onColumnsSelected, selectedColumns])

  const toggleColumn = useCallback(
    (column: string) => {
      setSelectedColumns((prev) => {
        const newSelection = prev.includes(column) ? prev.filter((col) => col !== column) : [...prev, column]

        // Get the current data (either original or renamed)
        const currentData = isRenameApplied ? previewData : data

        // Update parent with selected columns
        onColumnsSelected(
          newSelection.map((col) => (isRenameApplied ? columnRenames[col] || col : col)),
          currentData,
        )

        return newSelection
      })
    },
    [columnRenames, data, isRenameApplied, onColumnsSelected, previewData],
  )

  const toggleAllColumns = useCallback(() => {
    setSelectedColumns((prev) => {
      const newSelection = prev.length === columns.length ? [] : [...columns]

      // Get the current data (either original or renamed)
      const currentData = isRenameApplied ? previewData : data

      // Update parent with selected columns
      onColumnsSelected(
        newSelection.map((col) => (isRenameApplied ? columnRenames[col] || col : col)),
        currentData,
      )

      return newSelection
    })
  }, [columns, columnRenames, data, isRenameApplied, onColumnsSelected, previewData])

  const handleRenameColumn = useCallback((originalName: string, newName: string) => {
    const newValue = newName.trim() || originalName
    setColumnRenames((prev) => {
      const updated = {
        ...prev,
        [originalName]: newValue,
      }

      // Check if there are any changes from the original column names
      const hasChanges = Object.keys(updated).some((col) => updated[col] !== col)
      setHasRenameChanges(hasChanges)

      return updated
    })

    setIsRenameApplied(false)
  }, [])

  const handleNext = useCallback(() => {
    // If there are unapplied rename changes, apply them first
    if (hasRenameChanges && !isRenameApplied) {
      applyColumnRenames()
    }

    onNext()
  }, [applyColumnRenames, hasRenameChanges, isRenameApplied, onNext])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedColumns.length === columns.length}
            onCheckedChange={toggleAllColumns}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All Columns
          </label>
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowRenameOptions(!showRenameOptions)}>
          {showRenameOptions ? "Hide Rename Options" : "Rename Columns"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {columns.map((column) => (
          <div key={column} className="flex items-center space-x-2">
            <Checkbox
              id={`col-${column}`}
              checked={selectedColumns.includes(column)}
              onCheckedChange={() => toggleColumn(column)}
            />
            <label htmlFor={`col-${column}`} className="text-sm">
              {isRenameApplied ? columnRenames[column] || column : column}
            </label>
          </div>
        ))}
      </div>

      {showRenameOptions && (
        <div className="border p-4 rounded-md mb-6">
          <h3 className="text-sm font-medium mb-4">Rename Columns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columns.map((column) => (
              <div key={`rename-${column}`} className="space-y-1">
                <Label htmlFor={`rename-${column}`} className="text-xs">
                  {column}
                </Label>
                <Input
                  id={`rename-${column}`}
                  value={columnRenames[column] || column}
                  onChange={(e) => handleRenameColumn(column, e.target.value)}
                  placeholder={column}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={applyColumnRenames} className="flex items-center gap-2" disabled={!hasRenameChanges}>
              <Check className="h-4 w-4" />
              Apply Column Changes
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className={!selectedColumns.includes(column) ? "opacity-40" : ""}>
                    {isRenameApplied ? columnRenames[column] || column : column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell
                      key={`${rowIndex}-${column}`}
                      className={!selectedColumns.includes(column) ? "opacity-40" : ""}
                    >
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
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">Showing all {data.length} rows</p>
        <Button onClick={handleNext} disabled={selectedColumns.length === 0}>
          Next
        </Button>
      </div>
    </div>
  )
}

