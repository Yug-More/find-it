import { createMockClaim, listMockClaimsForUser, resetMockClaims, updateMockClaimStatus } from "../src/services/mockClaims";
import { listMockNotifications, resetMockNotifications } from "../src/services/mockNotifications";
import { getMockReport, resetMockReports } from "../src/services/mockReports";

beforeEach(() => { resetMockClaims(); resetMockReports(); resetMockNotifications(); });

it("rejects duplicate active claims and notifies competitors when a claim is approved", () => {
  const second = createMockClaim("sample-lost-keys","claimant-2",{message:"My keys"});
  expect(() => createMockClaim("sample-lost-keys","claimant-2",{message:"Again"})).toThrow("active claim");
  updateMockClaimStatus("claim-sample-1","user-1","approved");
  expect(getMockReport("sample-lost-keys").status).toBe("resolved");
  expect(listMockClaimsForUser("claimant-2").find(claim => claim.id === second.id)?.status).toBe("rejected");
  expect(listMockNotifications("claimant-2")).toEqual([expect.objectContaining({title:"Claim rejected"})]);
  expect(() => updateMockClaimStatus(second.id,"user-1","approved")).toThrow("pending");
  expect(() => updateMockClaimStatus("claim-sample-1","user-1","approved")).toThrow("pending");
});
