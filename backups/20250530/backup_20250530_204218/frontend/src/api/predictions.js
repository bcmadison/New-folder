import axios from "axios";

export const fetchPredictions = async () => {
  const res = await axios.get("http://127.0.0.1:8000/predictions");
  return res.data;
};

export const runPrediction = async () => {
  return await axios.post("http://127.0.0.1:8000/predict");
};