import { Contract } from "ethers";

export const createContractInstance = (
  contractAddress,
  abi,
  signerOrProvider
) => {
  return new Contract(contractAddress, abi, signerOrProvider);
};

export const callContractFunction = async (
  contractInstance,
  functionName,
  params = [],
  isReadOnly = true
) => {
    if (isReadOnly) {
      // Read-only function call (no gas cost)
      return await contractInstance[functionName](...params);
    } else {
      // State-changing function (requires gas fees)
      const tx = await contractInstance[functionName](...params);
      return await tx.wait(); // Wait for the transaction to be mined
    }
};
