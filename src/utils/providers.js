import { JsonRpcProvider, isAddress } from "ethers";

export const createProvider = (rpcUrl) => {
  return new JsonRpcProvider(rpcUrl);
};

export const isContractAddress = async (provider, address) => {
  if (!isAddress(address)) return false; // Validate the address format

  const code = await fetchBytecode(provider, address);
  return code !== "0x";
};

export const isWalletAddress = async (provider, address) => {
  if (!isAddress(address)) return false; // Validate the address format

  const code = await fetchBytecode(provider, address);
  return code === "0x"; // If the code is '0x', it's likely a wallet address (EOA)
};

export const fetchBytecode = async (provider, address) => {
  return await provider.getCode(address); // Get the bytecode at the address
};
