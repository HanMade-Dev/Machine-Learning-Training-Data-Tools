"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Info } from "lucide-react"

export default function AboutModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="About">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>About ML Training Platform</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">ML Training Platform</h4>
            <p className="text-sm text-gray-500">
              A comprehensive machine learning training tool that allows users to import data, clean and preprocess it,
              label features, train various machine learning models, and evaluate their performance.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Features</h4>
            <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
              <li>Data import from CSV and Excel files</li>
              <li>Data cleaning and preprocessing</li>
              <li>Feature selection and labeling</li>
              <li>Multiple ML algorithms with hyperparameter tuning</li>
              <li>Model evaluation with detailed metrics</li>
              <li>Export trained models in multiple formats</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Version</h4>
            <p className="text-sm text-gray-500">1.0.0</p>
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-center">
              Developed by <span className="font-bold">HanMade-Dev</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

