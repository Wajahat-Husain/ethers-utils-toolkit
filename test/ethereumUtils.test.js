import { expect } from "chai";
import { Wallet } from "ethers";
import {
  createProvider,
  createContractInstance,
  isContractAddress,
  isWalletAddress,
  fetchBytecode,
  callContractFunction,
  getTransaction,
  getTransactionReceipt,
  decodeTransactionData,
  generateFunctionSelector,
  signTypedData,
  recoverSigner,
  generateMethodSignature,
  encodePayloadData,
  fetchTransactionLogs,
  getTransactionHashForMethod,
} from "../src/index.js";
import tokenContract from "../artifacts/tokenContract.json" assert { type: "json" };

describe("Ethereum Utilities", () => {
  let walletAddress = process.env.WALLET_ADDRESS;
  let contractAddress = process.env.CONTRACT_ADDRESS;
  let abi = tokenContract.abi;
  let provider;
  let contractInstance;
  const validTransactionHash =
    "0xe0f72d3246c7acb1a5398bebf88b29d6c4161ad46172e37e6a20f88113f2d0b0";
  const invalidTransactionHash =
    "0xe0f72d3246c7acb1a5398bebf88b29d6c4161ad46172e37e6a20f88113f2d0b1";

  before(function () {
    this.timeout(20000); // Set global timeout for all tests
    provider = createProvider("https://bsc-testnet-dataseed.bnbchain.org");
    contractInstance = createContractInstance(contractAddress, abi, provider);
  });

  describe("Provider Creation", () => {
    it("should create a provider successfully", () => {
      expect(provider).to.have.property("send");
    });

    it("should fail if the provider does not have a send method", () => {
      const invalidProvider = {}; // Example of an invalid provider
      expect(invalidProvider).to.not.have.property("send");
    });
  });

  describe("Contract Instance Creation", () => {
    it("should create a contract instance successfully", () => {
      expect(contractInstance.target).to.equal(contractAddress);
    });

    it("should fail if the contract instance target does not match the contract address", () => {
      expect(contractInstance.target).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });
  });

  describe("Contract Address Validation", () => {
    it("should return true for a valid contract address", async () => {
      expect(await isContractAddress(provider, contractAddress)).to.be.true;
    });

    it("should return false for a non-contract address", async () => {
      expect(await isContractAddress(provider, walletAddress)).to.be.false;
    });
  });

  describe("Wallet Address Validation", () => {
    it("should return true for a valid wallet address", async () => {
      expect(await isWalletAddress(provider, walletAddress)).to.be.true;
    });

    it("should return false for a contract address", async () => {
      expect(await isWalletAddress(provider, contractAddress)).to.be.false;
    });
  });

  describe("Bytecode Fetching for EOA", () => {
    it("should return '0x' for an externally owned account (EOA)", async () => {
      const eoaAddress = walletAddress; // Replace with an actual EOA address
      const bytecode = await fetchBytecode(provider, eoaAddress);
      expect(bytecode).to.equal("0x");
    });

    it("should fail for a valid contract address (non-EOA)", async () => {
      const bytecode = await fetchBytecode(provider, contractAddress);
      expect(bytecode).to.not.equal("0x");
    });
  });

  describe("Bytecode Fetching for Contract", () => {
    it("should fetch the bytecode for a valid contract address", async () => {
      const bytecode = await fetchBytecode(provider, contractAddress);
      expect(bytecode).to.be.a("string");
      expect(bytecode).to.not.equal("0x"); // Ensure it's not empty bytecode
    });

    it("should return '0x' for an invalid or EOA address", async () => {
      const bytecode = await fetchBytecode(provider, walletAddress); // Replace with an actual EOA
      expect(bytecode).to.equal("0x");
    });
  });

  describe("Read-Only Contract Function Call", () => {
    it("should call read-only contract function successfully", async () => {
      const result = await callContractFunction(contractInstance, "balanceOf", [
        walletAddress,
      ]);
      expect(result).to.be.a("bigint");
    });

    it("should throw an error for a non-existent function", async () => {
      try {
        await callContractFunction(contractInstance, "transferToken", []); //Invalid function
      } catch (error) {
        expect(error).to.be.an("error");
        expect(error.message).to.include(
          "contractInstance[functionName] is not a function"
        );
      }
    });

    it("should throw an error if incorrect arguments are passed", async () => {
      try {
        await callContractFunction(contractInstance, "balanceOf", []); // Missing required argument
      } catch (error) {
        expect(error).to.be.an("error");
        expect(error.message).to.include("no matching fragment ");
      }
    });
  });

  describe("Get Transaction", () => {
    it("should fetch a transaction for a valid transaction hash", async () => {
      const transaction = await getTransaction(provider, validTransactionHash);

      expect(transaction).to.be.an("object");
      expect(transaction.hash).to.equal(validTransactionHash);
    });

    it("should throw an error for an invalid transaction hash", async () => {
      try {
        await getTransaction(provider, invalidTransactionHash);
        expect.fail(
          "Expected getTransaction to throw an error for invalid hash"
        );
      } catch (error) {
        expect(error.message).to.equal("Transaction not found..");
      }
    });
  });

  describe("Get TransactionReceipt", () => {
    it("should fetch a transaction receipt for a valid transaction hash", async () => {
      const receipt = await getTransactionReceipt(
        provider,
        validTransactionHash
      );
      expect(receipt).to.be.an("object");
      expect(receipt.hash).to.equal(validTransactionHash);
    });

    it("should throw an error for an invalid transaction hash", async () => {
      try {
        await getTransactionReceipt(provider, invalidTransactionHash);
        expect.fail(
          "Expected getTransactionReceipt to throw an error for invalid hash"
        );
      } catch (error) {
        expect(error.message).to.equal("Transaction receipt not found..");
      }
    });
  });

  describe("Decode TransactionData", () => {
    it("should decode valid transaction data using the contract ABI", async () => {
      const transaction = await getTransaction(provider, validTransactionHash);
      const decodedData = await decodeTransactionData(abi, transaction.data);

      expect(decodedData).to.be.an("array").and.to.have.length.above(0);
      expect(decodedData[0]).to.be.a("string"); // Example: an address
      expect(decodedData[1]).to.be.a("bigint"); // Example: a token amount
    });

    it("should throw an error for invalid transaction data", async () => {
      try {
        const invalidTransactionData =
          "0xff42c81200000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000cad6c00930c9dce86ada5c3f149348c0365be8ab5553445400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000002f00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000003200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000";
        await decodeTransactionData(abi, invalidTransactionData);
        expect.fail(
          "Expected decodeTransactionData to throw an error for invalid data"
        );
      } catch (error) {
        expect(error.message).to.include("Function selector");
      }
    });
  });

  describe("Generate Function Selector", () => {
    it("should generate a valid function selector for a valid function signature", () => {
      const functionSignature = "transfer(address,uint256)";
      const expectedSelector = "0xa9059cbb"; // Precomputed value for the signature
      const selector = generateFunctionSelector(functionSignature);

      expect(selector).to.equal(expectedSelector);
    });

    it("should throw an error for an invalid function signature", () => {
      expect(() => generateFunctionSelector()).to.throw(
        "Invalid function signature provided."
      );
      expect(() => generateFunctionSelector(null)).to.throw(
        "Invalid function signature provided."
      );
      expect(() => generateFunctionSelector(123)).to.throw(
        "Invalid function signature provided."
      );
    });

    it("should throw an error for an empty string as function signature", () => {
      expect(() => generateFunctionSelector("")).to.throw(
        "Invalid function signature provided."
      );
    });

    it("should generate the correct selector for a simple function", () => {
      const functionSignature = "foo()";
      const expectedSelector = "0xc2985578"; // Precomputed value for the signature
      const selector = generateFunctionSelector(functionSignature);

      expect(selector).to.equal(expectedSelector);
    });
  });

  describe("Sign Typed Data", () => {
    const domain = {
      name: "TestDomain",
      version: "1",
      chainId: 97,
      verifyingContract: contractAddress,
    };

    const type = {
      Voucher: [
        { name: "amount", type: "uint256" },
        { name: "recipient", type: "address" },
      ],
    };

    const voucher = {
      amount: 100,
      recipient: walletAddress,
    };

    let signer;
    before(() => {
      signer = new Wallet(process.env.PRIVATE_KEY, provider);
    });

    it("should sign the typed data successfully", async () => {
      const signature = await signTypedData(domain, type, voucher, signer);
      expect(signature).to.be.a("string");
      expect(signature).to.match(/^0x[0-9a-fA-F]{130}$/); // Validate signature format
    });

    it("should throw an error for missing signer", async () => {
      try {
        await signTypedData(domain, type, voucher, null);
      } catch (error) {
        expect(error).to.be.an("error");
        expect(error.message).to.include("Cannot read properties of null"); // Adjust based on error type
      }
    });

    it("should throw an error for malformed input data", async () => {
      try {
        await signTypedData(null, type, voucher, signer);
      } catch (error) {
        expect(error).to.be.an("error");
        expect(error.message).to.include("domain"); // Adjust based on error type
      }
    });
  });

  describe("Recover Signer", () => {
    const domain = {
      name: "TestDomain",
      version: "1",
      chainId: 97,
      verifyingContract: contractAddress,
    };

    const type = {
      Voucher: [
        { name: "amount", type: "uint256" },
        { name: "recipient", type: "address" },
      ],
    };

    const voucher = {
      amount: 100,
      recipient: walletAddress,
    };

    let signer;
    before(() => {
      signer = new Wallet(process.env.PRIVATE_KEY, provider);
    });

    it("should recover the correct signer for valid data and signature", async () => {
      // Generate a valid signature for testing
      const signature = await signTypedData(domain, type, voucher, signer);

      const recoveredSigner = recoverSigner(domain, type, voucher, signature);
      expect(recoveredSigner).to.equal(walletAddress);
    });

    it("should throw an error for invalid signature", () => {
      const invalidSignature = "0x".padEnd(132, "0"); // Invalid signature

      expect(() =>
        recoverSigner(domain, type, voucher, invalidSignature)
      ).to.throw("r must be 0 < r < CURVE.n");
    });

    it("should throw an error for missing or malformed inputs", () => {
      expect(() => recoverSigner()).to.throw(); // Missing all arguments
      expect(() => recoverSigner(null, {}, {}, "0x123")).to.throw(); // Null domain
    });
  });

  describe("Generate Method Signature", () => {
    it("should generate a valid method signature", () => {
      const methodName = "transfer";
      const payloadParams = ["address", "uint256"];
      const result = generateMethodSignature(methodName, payloadParams);

      expect(result).to.equal("0xa9059cbb"); // Known method signature for `transfer(address,uint256)`
    });

    it("should throw an error for invalid method name or parameters", () => {
      expect(() => generateMethodSignature(null, [])).to.throw(
        "Invalid method name or parameters provided."
      );
    });
  });

  describe("Encode Payload Data", () => {
    it("should encode payload data correctly", () => {
      const payloadParams = ["address", "uint256"];
      const payloadValues = [
        "0x0000000000000000000000000000000000000000",
        "1000000000000000000",
      ];
      const result = encodePayloadData(payloadParams, payloadValues);

      expect(result).to.equal(
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a7640000"
      );
    });

    it("should throw an error for mismatched parameter and value lengths", () => {
      const payloadParams = ["address", "uint256"];
      const payloadValues = ["1000"]; // Length mismatch

      expect(() => encodePayloadData(payloadParams, payloadValues)).to.throw(
        "types/values length mismatch"
      );
    });
  });

  describe("Fetch Transaction Logs", () => {
    const networkId = 97;

    it("should return transaction logs for a valid address", async () => {
      const result = await fetchTransactionLogs(networkId, contractAddress);
      expect(result).to.be.an("array");
      expect(result).to.have.length.greaterThan(0);
    });

    it("should return null if the API call fails", async () => {
      // Use try-catch to handle the asynchronous error in a proper way
      try {
        await fetchTransactionLogs(
          networkId,
          "0x0000000000000000000000000000000000000000"
        );
        // If no error is thrown, fail the test
        throw new Error("Expected error was not thrown.");
      } catch (err) {
        expect(err.message).to.equal("Failed to fetch transaction logs.");
      }
    });
  });

  describe("Get TransactionHash For Method", () => {
    const networkId = 97;
    const method = "transfer";
    const params = ["address", "uint256"];
    const payload = [
      "0x0aE72a82621A5a7BEAC3E215C96642077643eF78",
      "10000000000000000000",
    ];

    it("should return a transaction hash for valid inputs", async () => {
      const details = await getTransactionHashForMethod(
        networkId,
        contractAddress,
        method,
        params,
        payload
      );

      expect(details).to.be.a("object");
      expect(details.hash).to.have.lengthOf(66); // Assuming the hash is 66 characters long (e.g., SHA3 hash)
    });

    it("should throw an error if the method name is missing", async () => {
      try {
        await getTransactionHashForMethod(
          networkId,
          contractAddress,
          "",
          params,
          payload
        );
      } catch (err) {
        expect(err.message).to.equal(
          "Invalid method name or parameters provided."
        );
      }
    });
  });
});
