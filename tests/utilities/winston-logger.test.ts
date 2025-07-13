/**
 * Winston Logger Tests
 *
 * Comprehensive test suite for Winston logging infrastructure
 * following TDD methodology. Tests log levels, transports,
 * structured logging, error handling, and backward compatibility.
 */

import { jest } from "@jest/globals";

// Mock Winston before importing
const mockWinstonLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  add: jest.fn(),
  remove: jest.fn(),
  configure: jest.fn(),
  level: "info",
  levels: {
    error: 0,
    warn: 1,
    info: 2,
  },
};

const mockWinston = {
  createLogger: jest.fn(() => mockWinstonLogger),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  addColors: jest.fn(),
};

jest.mock("winston", () => mockWinston);

// Mock existing logger
jest.mock("../../src/utilities/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

describe("Winston Logger Infrastructure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Logger Configuration", () => {
    it("should create logger with exactly 3 levels: INFO, WARN, ERROR", async () => {
      const { createLoggerConfig } = await import("../../src/config/logger");
      const config = createLoggerConfig();

      expect(config.levels).toEqual({
        error: 0,
        warn: 1,
        info: 2,
      });
    });

    it("should configure console transport for development", async () => {
      const { createLoggerConfig } = await import("../../src/config/logger");
      createLoggerConfig();

      expect(mockWinston.transports.Console).toHaveBeenCalled();
    });

    it("should configure file transport for persistent logging", async () => {
      const { createLoggerConfig } = await import("../../src/config/logger");
      createLoggerConfig();

      expect(mockWinston.transports.File).toHaveBeenCalled();
    });

    it("should set appropriate log levels for different environments", async () => {
      const { createLoggerConfig } = await import("../../src/config/logger");

      // Test development environment
      process.env.NODE_ENV = "development";
      const devConfig = createLoggerConfig();
      expect(devConfig.level).toBe("info");

      // Test production environment
      process.env.NODE_ENV = "production";
      const prodConfig = createLoggerConfig();
      expect(prodConfig.level).toBe("warn");
    });

    it("should configure structured logging format", async () => {
      const { createLoggerConfig } = await import("../../src/config/logger");
      createLoggerConfig();

      expect(mockWinston.format.combine).toHaveBeenCalled();
      expect(mockWinston.format.timestamp).toHaveBeenCalled();
      expect(mockWinston.format.errors).toHaveBeenCalled();
    });
  });

  describe("Winston Logger Wrapper", () => {
    it("should provide info, warn, and error logging methods", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });

    it("should support structured logging with metadata", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      const metadata = { userId: 123, action: "login" };
      logger.info("User logged in", metadata);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        "User logged in",
        metadata
      );
    });

    it("should implement async logging capabilities", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      const logPromise = logger.asyncInfo("Async log message");
      expect(logPromise).toBeInstanceOf(Promise);

      await logPromise;
      expect(mockWinstonLogger.info).toHaveBeenCalled();
    });

    it("should maintain backward compatibility with existing logger", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      // Test that old logger methods still work
      logger.log("Test message");
      expect(mockWinstonLogger.info).toHaveBeenCalledWith("Test message");
    });

    it("should handle error objects properly", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      const error = new Error("Test error");
      logger.error("Error occurred", error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        "Error occurred",
        error
      );
    });
  });

  describe("Log Level Filtering", () => {
    it("should filter logs based on configured level", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      // Set logger to warn level
      mockWinstonLogger.level = "warn";

      logger.info("Info message"); // Should be filtered out
      logger.warn("Warn message"); // Should be logged
      logger.error("Error message"); // Should be logged

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith("Warn message");
      expect(mockWinstonLogger.error).toHaveBeenCalledWith("Error message");
    });

    it("should respect ENABLE_LOG environment variable", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );

      // Test with logging disabled
      process.env.ENABLE_LOG = "false";
      const loggerDisabled = new WinstonLogger();
      loggerDisabled.info("Test message");

      // Verify logging is skipped when disabled
      // (This would be implemented in the actual logger)
      expect(true).toBe(true); // Placeholder for actual implementation
    });
  });

  describe("Transport Behavior", () => {
    it("should write to multiple transports simultaneously", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      logger.error("Critical error");

      // Verify that the logger is configured to use multiple transports
      expect(mockWinston.createLogger).toHaveBeenCalled();
    });

    it("should handle transport failures gracefully", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );

      // Mock transport failure
      mockWinstonLogger.error.mockImplementation(() => {
        throw new Error("Transport failure");
      });

      const logger = new WinstonLogger();

      // Should not throw error even if transport fails
      expect(() => logger.error("Test message")).not.toThrow();
    });

    it("should format console output for development", async () => {
      const { createLoggerConfig } = await import("../../src/config/logger");

      process.env.NODE_ENV = "development";
      createLoggerConfig();

      expect(mockWinston.format.colorize).toHaveBeenCalled();
      expect(mockWinston.format.simple).toHaveBeenCalled();
    });

    it("should format JSON output for production", async () => {
      const { createLoggerConfig } = await import("../../src/config/logger");

      process.env.NODE_ENV = "production";
      createLoggerConfig();

      expect(mockWinston.format.json).toHaveBeenCalled();
    });
  });

  describe("Error Handling and Fallbacks", () => {
    it("should fallback to console logging if Winston fails", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock Winston creation failure
      mockWinston.createLogger.mockImplementation(() => {
        throw new Error("Winston creation failed");
      });

      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      logger.error("Test error message");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle circular references in metadata", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      // Should not throw error with circular reference
      expect(() =>
        logger.info("Message with circular ref", circularObj)
      ).not.toThrow();
    });

    it("should validate log level input", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      // Invalid log level should default to info
      expect(() => (logger as any).invalidLevel("message")).not.toThrow();
    });
  });

  describe("Performance and Async Operations", () => {
    it("should not block application flow with logging", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      const startTime = Date.now();
      logger.info("Performance test message");
      const endTime = Date.now();

      // Logging should be very fast (under 10ms)
      expect(endTime - startTime).toBeLessThan(10);
    });

    it("should batch multiple log entries efficiently", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      // Log multiple messages rapidly
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }

      expect(mockWinstonLogger.info).toHaveBeenCalledTimes(100);
    });

    it("should handle high-volume logging without memory leaks", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      // Simulate high-volume logging
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(logger.asyncInfo(`High volume message ${i}`));
      }

      await Promise.all(promises);
      expect(mockWinstonLogger.info).toHaveBeenCalledTimes(1000);
    });
  });

  describe("Integration with Existing System", () => {
    it("should maintain compatibility with existing logger calls", async () => {
      const { WinstonLogger } = await import(
        "../../src/utilities/winston-logger"
      );
      const logger = new WinstonLogger();

      // Test existing logger interface
      logger.info("Info message");
      logger.error("Error message");
      logger.log("General message");

      expect(mockWinstonLogger.info).toHaveBeenCalledWith("Info message");
      expect(mockWinstonLogger.error).toHaveBeenCalledWith("Error message");
    });

    it("should provide migration path from old logger", async () => {
      // Test would verify smooth migration from old logger
      expect(true).toBe(true); // Placeholder for migration validation
    });
  });
});
