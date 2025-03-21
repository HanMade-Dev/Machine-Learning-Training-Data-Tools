"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Github, Globe } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">About</h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Machine Learning Platform</h2>
          <p className="text-gray-700 mb-4">
            This platform is designed to simplify the machine learning workflow, from data preparation to model training
            and analysis. It provides an intuitive interface for users to train models and analyze data without
            requiring extensive programming knowledge.
          </p>
          <p className="text-gray-700">
            Whether you're a data scientist, analyst, or domain expert, this tool helps you leverage the power of
            machine learning to gain insights from your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Data Training</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Upload CSV or Excel files</li>
                <li>Clean and normalize data</li>
                <li>Label data manually or use existing labels</li>
                <li>Configure and train various ML models</li>
                <li>Evaluate model performance</li>
                <li>Export trained models and reports</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Data Analysis</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Upload trained models</li>
                <li>Analyze new datasets</li>
                <li>Visualize prediction results</li>
                <li>Compare feature distributions</li>
                <li>Export analysis results</li>
                <li>Interactive data exploration</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Technologies</h2>
          <p className="text-gray-700 mb-4">This platform is built using modern web technologies:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Next.js for the frontend framework</li>
            <li>React for UI components</li>
            <li>Tailwind CSS for styling</li>
            <li>Recharts for data visualization</li>
            <li>Machine learning algorithms for data analysis</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <p className="text-gray-700 mb-4">To get started with the platform:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Upload your dataset in CSV or Excel format</li>
            <li>Clean and prepare your data</li>
            <li>Label your data or select an existing target column</li>
            <li>Configure and train your model</li>
            <li>Evaluate the results and export your model</li>
            <li>Use the trained model to analyze new data</li>
          </ol>
        </section>

        <section className="pt-4 border-t">
          <div className="flex justify-center space-x-4">
            <Link href="/" className="text-primary hover:underline flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Home
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub Repository
            </a>
          </div>
          <p className="text-center text-gray-500 mt-4">
            © {new Date().getFullYear()} Machine Learning Platform. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  )
}

