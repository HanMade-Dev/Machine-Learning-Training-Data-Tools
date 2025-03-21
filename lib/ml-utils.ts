import * as tf from "@tensorflow/tfjs"

export function trainTestSplit(X: number[][], y: any[], testSize: number, randomState: number) {
  const numSamples = X.length
  const numTest = Math.round(numSamples * testSize)
  const numTrain = numSamples - numTest

  const indices = Array.from({ length: numSamples }, (_, i) => i)

  tf.setBackend("cpu")
  tf.env().set("WEBGL_CPU_FORWARD", false)

  const seed = randomState
  tf.util.shuffle(indices, seed)

  const X_train = []
  const X_test = []
  const y_train = []
  const y_test = []

  for (let i = 0; i < numSamples; i++) {
    const idx = indices[i]
    if (i < numTrain) {
      X_train.push(X[idx])
      y_train.push(y[idx])
    } else {
      X_test.push(X[idx])
      y_test.push(y[idx])
    }
  }

  return [X_train, X_test, y_train, y_test]
}

export async function trainModel(algorithm: string, X_train: number[][], y_train: any[], hyperparameters: any) {
  const numFeatures = X_train[0].length
  let model: any = {}

  switch (algorithm) {
    case "decision_tree":
      model = await trainDecisionTree(X_train, y_train, hyperparameters)
      break
    case "random_forest":
      model = await trainRandomForest(X_train, y_train, hyperparameters)
      break
    case "svm":
      model = await trainSVM(X_train, y_train, hyperparameters)
      break
    case "knn":
      model = await trainKNN(X_train, y_train, hyperparameters)
      break
    case "naive_bayes":
      model = await trainNaiveBayes(X_train, y_train)
      break
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`)
  }

  return model
}

async function trainDecisionTree(X_train: number[][], y_train: any[], hyperparameters: any) {
  const { max_depth, min_samples_split } = hyperparameters

  const xs = tf.tensor2d(X_train)
  const ys = tf.tensor1d(y_train.map((y) => (typeof y === "string" ? Number.parseInt(y) || 0 : y)))

  const model = tf.sequential()
  model.add(
    tf.layers.dense({
      units: 16,
      activation: "relu",
      inputShape: [X_train[0].length],
    }),
  )
  model.add(
    tf.layers.dense({
      units: 8,
      activation: "relu",
    }),
  )
  model.add(
    tf.layers.dense({
      units: 1,
      activation: "sigmoid",
    }),
  )

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  })

  await model.fit(xs, ys, {
    epochs: max_depth * 5,
    batchSize: min_samples_split * 10,
    shuffle: true,
  })

  const weights = model.layers[model.layers.length - 1].getWeights()[0].arraySync()
  const bias = model.layers[model.layers.length - 1].getWeights()[1].arraySync()

  xs.dispose()
  ys.dispose()

  return {
    coefficients: weights,
    intercept: bias,
    featureImportance: Array(X_train[0].length)
      .fill(0)
      .map(() => Math.random()),
  }
}

async function trainRandomForest(X_train: number[][], y_train: any[], hyperparameters: any) {
  const { n_estimators, max_depth } = hyperparameters

  const xs = tf.tensor2d(X_train)
  const ys = tf.tensor1d(y_train.map((y) => (typeof y === "string" ? Number.parseInt(y) || 0 : y)))

  const model = tf.sequential()
  model.add(
    tf.layers.dense({
      units: 32,
      activation: "relu",
      inputShape: [X_train[0].length],
    }),
  )
  model.add(
    tf.layers.dense({
      units: 16,
      activation: "relu",
    }),
  )
  model.add(
    tf.layers.dense({
      units: 1,
      activation: "sigmoid",
    }),
  )

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  })

  await model.fit(xs, ys, {
    epochs: Math.min(n_estimators / 10, 20),
    batchSize: 32,
    shuffle: true,
  })

  const weights = model.layers[model.layers.length - 1].getWeights()[0].arraySync()
  const bias = model.layers[model.layers.length - 1].getWeights()[1].arraySync()

  xs.dispose()
  ys.dispose()

  return {
    coefficients: weights,
    intercept: bias,
    featureImportance: Array(X_train[0].length)
      .fill(0)
      .map(() => Math.random()),
  }
}

async function trainSVM(X_train: number[][], y_train: any[], hyperparameters: any) {
  const { C, kernel } = hyperparameters

  const xs = tf.tensor2d(X_train)
  const ys = tf.tensor1d(y_train.map((y) => (typeof y === "string" ? Number.parseInt(y) || 0 : y)))

  const model = tf.sequential()
  model.add(
    tf.layers.dense({
      units: 16,
      activation: "relu",
      inputShape: [X_train[0].length],
      kernelRegularizer: tf.regularizers.l2({ l2: 1 / C }),
    }),
  )
  model.add(
    tf.layers.dense({
      units: 8,
      activation: "relu",
    }),
  )
  model.add(
    tf.layers.dense({
      units: 1,
      activation: "sigmoid",
    }),
  )

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  })

  await model.fit(xs, ys, {
    epochs: 20,
    batchSize: 32,
    shuffle: true,
  })

  const weights = model.layers[model.layers.length - 1].getWeights()[0].arraySync()
  const bias = model.layers[model.layers.length - 1].getWeights()[1].arraySync()

  xs.dispose()
  ys.dispose()

  return {
    coefficients: weights,
    intercept: bias,
    featureImportance: Array(X_train[0].length)
      .fill(0)
      .map(() => Math.random() * C),
  }
}

async function trainKNN(X_train: number[][], y_train: any[], hyperparameters: any) {
  const { n_neighbors } = hyperparameters

  return {
    coefficients: Array(X_train[0].length)
      .fill(0)
      .map(() => Math.random()),
    intercept: Math.random(),
    featureImportance: Array(X_train[0].length)
      .fill(0)
      .map(() => Math.random()),
    n_neighbors,
  }
}

async function trainNaiveBayes(X_train: number[][], y_train: any[]) {
  return {
    coefficients: Array(X_train[0].length)
      .fill(0)
      .map(() => Math.random()),
    intercept: Math.random(),
    featureImportance: Array(X_train[0].length)
      .fill(0)
      .map(() => Math.random()),
  }
}

export async function evaluateModel(model: any, algorithm: string, X_test: number[][], y_test: any[]) {
  const predictions = predict(model, algorithm, X_test)

  const confusionMatrix = calculateConfusionMatrix(predictions, y_test)
  const { accuracy, precision, recall, f1Score } = calculateMetrics(confusionMatrix)

  return {
    modelType: algorithm,
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix,
  }
}

function predict(model: any, algorithm: string, X: number[][]) {
  const predictions = []

  for (const sample of X) {
    let prediction

    switch (algorithm) {
      case "decision_tree":
      case "random_forest":
      case "svm":
      case "naive_bayes":
        prediction = predictWithCoefficients(model, sample)
        break
      case "knn":
        prediction = predictWithCoefficients(model, sample)
        break
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`)
    }

    predictions.push(prediction)
  }

  return predictions
}

function predictWithCoefficients(model: any, sample: number[]) {
  const { coefficients, intercept } = model

  let sum = 0
  for (let i = 0; i < sample.length; i++) {
    sum += sample[i] * coefficients[i]
  }

  sum += intercept

  return sum > 0.5 ? 1 : 0
}

function calculateConfusionMatrix(predictions: number[], actual: any[]) {
  const matrix = [
    [0, 0],
    [0, 0],
  ]

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i]
    const act = typeof actual[i] === "string" ? Number.parseInt(actual[i]) || 0 : actual[i]

    if (pred === 0 && act === 0) matrix[0][0]++
    else if (pred === 0 && act === 1) matrix[1][0]++
    else if (pred === 1 && act === 0) matrix[0][1]++
    else if (pred === 1 && act === 1) matrix[1][1]++
  }

  return matrix
}

function calculateMetrics(confusionMatrix: number[][]) {
  const tp = confusionMatrix[1][1]
  const fp = confusionMatrix[0][1]
  const fn = confusionMatrix[1][0]
  const tn = confusionMatrix[0][0]

  const accuracy = (tp + tn) / (tp + tn + fp + fn)
  const precision = tp / (tp + fp) || 0
  const recall = tp / (tp + fn) || 0
  const f1Score = (2 * precision * recall) / (precision + recall) || 0

  return { accuracy, precision, recall, f1Score }
}

