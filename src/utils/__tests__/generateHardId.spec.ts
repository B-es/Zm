import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateHardwareId, collectHardwareIds } from "../generateHardId";

describe("generateHardwareId", () => {
  it("должен выдать ids железа", async () => {
    const ids = await collectHardwareIds();
    expect(ids).toBeDefined();
    expect(ids.cpuSerial).toBeDefined();
    expect(ids.motherboardSerial).toBeDefined();
    expect(ids.diskSerial).toBeDefined();
    expect(ids.macAddresses).toBeDefined();
  });

  it("должен сгенирировать постоянный id по железу", async () => {
    const id = await generateHardwareId();
    expect(id).toBeDefined();
    expect(id).toHaveLength(64);
  });
}, 15000);
