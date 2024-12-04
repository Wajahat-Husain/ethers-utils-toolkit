import { verifyTypedData, id } from "ethers";

// Generate the function selector for a given function signature.
export const generateFunctionSelector = (functionSignature) => {
  if (!functionSignature || typeof functionSignature !== "string")
    throw new Error("Invalid function signature provided.");

  return id(functionSignature).slice(0, 10);
};

export const signTypedData = (domain, type, voucher, signer) => {
  return signer.signTypedData(domain, type, voucher);
};

export const recoverSigner = (domain, type, voucher, signature) => {
  return verifyTypedData(domain, type, voucher, signature);
};
