const { resetSupabaseMock } = require("./tests/supabaseMock");

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  resetSupabaseMock();
});
