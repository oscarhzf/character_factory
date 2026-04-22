import { describe, expect, it } from "vitest";

import { getCharacterTaskPromptFields } from "./job-form-state";

describe("job form character defaults", () => {
  it("resets task prompt fields to empty strings when the selected character has no defaults", () => {
    expect(
      getCharacterTaskPromptFields({
        variableDefaults: {
          action: "",
          expression: "",
          prop: "",
          view: "",
          pose: "",
          composition: ""
      }
      })
    ).toEqual({
      action: "",
      expression: "",
      prop: "",
      view: "",
      pose: "",
      composition: ""
    });
  });
});
