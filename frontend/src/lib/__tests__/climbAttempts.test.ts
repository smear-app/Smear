import { describe, expect, it } from "vitest"

import {
  clampCustomAttempts,
  clampCustomAttemptsInput,
  resolveDraftAttempts,
  sanitizeCustomAttemptsInput,
} from "../climbAttempts"

describe("climbAttempts", () => {
  it("treats flash as valid with one attempt", () => {
    expect(
      resolveDraftAttempts({
        sendType: "Flash",
        attemptsSlider: 6,
        attemptsUseCustom: true,
        attemptsCustom: "42",
      }),
    ).toMatchObject({ isValid: true, attempts: 1 })
  })

  it("uses slider attempts for send and attempt by default", () => {
    expect(
      resolveDraftAttempts({
        sendType: "Send",
        attemptsSlider: 5,
        attemptsUseCustom: false,
        attemptsCustom: "2",
      }),
    ).toMatchObject({ isValid: true, attempts: 5 })

    expect(
      resolveDraftAttempts({
        sendType: "Attempt",
        attemptsSlider: 3,
        attemptsUseCustom: false,
        attemptsCustom: "2",
      }),
    ).toMatchObject({ isValid: true, attempts: 3 })
  })

  it("requires a valid custom attempt count between 2 and 99", () => {
    expect(
      resolveDraftAttempts({
        sendType: "Send",
        attemptsSlider: 2,
        attemptsUseCustom: true,
        attemptsCustom: "1",
      }).isValid,
    ).toBe(false)

    expect(
      resolveDraftAttempts({
        sendType: "Attempt",
        attemptsSlider: 2,
        attemptsUseCustom: true,
        attemptsCustom: "17",
      }),
    ).toMatchObject({ isValid: true, attempts: 17 })
  })

  it("clamps and sanitizes custom attempt input", () => {
    expect(sanitizeCustomAttemptsInput("a9b7")).toBe("97")
    expect(clampCustomAttempts(1)).toBe(2)
    expect(clampCustomAttempts(120)).toBe(99)
    expect(clampCustomAttemptsInput("0")).toBe("2")
    expect(clampCustomAttemptsInput("123")).toBe("99")
  })
})
