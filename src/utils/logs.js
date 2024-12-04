import { keccak256, toUtf8Bytes, AbiCoder, toBeHex } from "ethers";
import Moralis from "moralis";
import { config } from "dotenv";
config();

await Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
});

const getTransactionHashForMethod = async (
  networkId,
  contractAddress,
  methodName,
  payloadParams,
  payloadValues
) => {
  if (!Array.isArray(payloadParams) || !Array.isArray(payloadValues))
    console.error("Payload parameters and values must be arrays.");

  if (payloadParams.length !== payloadValues.length)
    console.error("Payload parameters and values must have the same length.");

  // Generate the method signature using keccak256 hash
  const methodSignature = generateMethodSignature(methodName, payloadParams);

  // Encode the payload data based on provided parameters
  const payloadData = encodePayloadData(payloadParams, payloadValues);

  // Fetch recent transactions for the contract address
  const transactionLogs = await fetchTransactionLogs(
    networkId,
    contractAddress
  );
  if (!transactionLogs || transactionLogs.length === 0) {
    console.warn("No transactions found for the specified contract address.");
    return null;
  }

  const inputData = methodSignature + payloadData;
  const matchingTransaction = transactionLogs.find(
    (log) => log.input === inputData
  );
  if (!matchingTransaction) return null;

  return {
    hash: matchingTransaction.hash,
    data: matchingTransaction.input,
    from: matchingTransaction.from_address,
    to: matchingTransaction.to_address,
    value: matchingTransaction.value,
    gasLimit: matchingTransaction.gas,
    status: matchingTransaction.receipt_status ? true : false,
  };
};

// Helper: function to generate the method signature
const generateMethodSignature = (methodName, payloadParams) => {
  if (!methodName || !Array.isArray(payloadParams))
    throw new Error("Invalid method name or parameters provided.");

  return keccak256(
    toUtf8Bytes(`${methodName}(${payloadParams.join(",")})`)
  ).slice(0, 10);
};

// Helper: function to encode payload data
const encodePayloadData = (payloadParams, payloadValues) => {
  const abiCoder = AbiCoder.defaultAbiCoder();
  return abiCoder.encode(payloadParams, payloadValues).replace("0x", "");
};

// Helper: function to fetch transaction logs for a specific network and contract address
const fetchTransactionLogs = async (networkId, contractAddress) => {
  try {
    const response = await Moralis.EvmApi.transaction.getWalletTransactions({
      chain: toBeHex(networkId),
      order: "DESC",
      address: contractAddress,
    });
    return response?.raw?.result;
  } catch (err) {
    // console.error(`Failed to fetch transaction logs: ${err.message}`);
    throw new Error("Failed to fetch transaction logs.");
    return null;
  }
};

export {
  getTransactionHashForMethod,
  generateMethodSignature,
  encodePayloadData,
  fetchTransactionLogs,
};
