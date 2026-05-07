
import { executionNodes } from "./execution";
import { experimentNodes } from "./experiments";
import { memoryNodes } from "./memory";

export const gpuGraphNodes = [
  
  ...executionNodes,
  ...experimentNodes,
  ...memoryNodes,
];

export {
  
  executionNodes,
  experimentNodes,
  memoryNodes,
};