import { Interface } from "ethers";

// Fetches a transaction by its hash from the provider.
export const getTransaction = async (provider, transactionHash) => {
  const transaction = await provider.getTransaction(transactionHash);
  if (!transaction) throw new Error("Transaction not found..");
  return transaction;
};

// Fetches the receipt of a transaction by its hash.
export const getTransactionReceipt = async (provider, transactionHash) => {
  const receipt = await provider.getTransactionReceipt(transactionHash);
  if (!receipt) throw new Error("Transaction receipt not found..");
  return receipt;
};

// Extracts and decodes the transaction input data based on the ABI provided.
export const decodeTransactionData = async (contractAbi, transactionData) => {
  // Create an interface from the contract ABI
  const contractInterface = new Interface(contractAbi);

  // Extract the function selector (first 4 bytes of the transaction data)
  const functionSelector = transactionData.slice(0, 10); // '0x' + first 8 chars = 10

  // Get the function fragment using the function selector
  const functionFragment = contractInterface.getFunction(functionSelector);
  if (!functionFragment)
    throw new Error(`Function selector ${functionSelector} not found in ABI.`);

  // Decode and return the transaction data using the function fragment
  return contractInterface.decodeFunctionData(
    functionFragment,
    transactionData
  );
};
