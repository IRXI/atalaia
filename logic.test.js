import assert from "node:assert/strict";
import test from "node:test";
import {
  dailyItem,
  formatStreak,
  localDate,
  nextStreak,
  pickId,
  videoUrl,
} from "./logic.js";

test("videoUrl keeps spaces and parentheses in the filename", () => {
  assert.equal(
    videoUrl("3 Facebook (1).mp4"),
    "biblioteca/3%20Facebook%20(1).mp4",
  );
  assert.equal(
    videoUrl("aula claude.mp4"),
    "biblioteca/aula%20claude.mp4",
  );
});

test("pickId returns null when the library is empty", () => {
  assert.equal(pickId([], "lib:a.mp4", () => 0), null);
});

test("pickId plays the only video even when it was the last one", () => {
  assert.equal(pickId(["lib:solo.mp4"], "lib:solo.mp4", () => 0.9), "lib:solo.mp4");
});

test("pickId avoids the last video when there is more than one", () => {
  const ids = ["lib:a.mp4", "lib:b.mp4", "lib:c.mp4"];
  assert.equal(pickId(ids, "lib:a.mp4", () => 0), "lib:b.mp4");
  assert.equal(pickId(ids, "lib:a.mp4", () => 0.999), "lib:c.mp4");
  assert.notEqual(pickId(ids, "lib:b.mp4", () => 0), "lib:b.mp4");
});

test("nextStreak starts at one day and does not climb on the same day", () => {
  assert.deepEqual(nextStreak(null, "2026-11-13"), {
    streak: 1,
    lastOpen: "2026-11-13",
  });
  assert.deepEqual(
    nextStreak({ streak: 4, lastOpen: "2026-11-13" }, "2026-11-13"),
    { streak: 4, lastOpen: "2026-11-13" },
  );
});

test("nextStreak increments across a month boundary and resets after a gap", () => {
  assert.deepEqual(
    nextStreak({ streak: 4, lastOpen: "2026-01-31" }, "2026-02-01"),
    { streak: 5, lastOpen: "2026-02-01" },
  );
  assert.deepEqual(
    nextStreak({ streak: 9, lastOpen: "2026-01-30" }, "2026-02-01"),
    { streak: 1, lastOpen: "2026-02-01" },
  );
});

test("formatStreak uses dia or dias", () => {
  assert.equal(formatStreak(1), "1 dia");
  assert.equal(formatStreak(2), "2 dias");
});

test("dailyItem stays on the same line for the whole date", () => {
  const items = ["alpha", "beta", "gamma", "delta"];
  const first = dailyItem(items, "2026-11-13");
  assert.equal(dailyItem(items, "2026-11-13"), first);
  assert.ok(items.includes(first));
  assert.equal(localDate(new Date(2026, 10, 13, 23, 30)), "2026-11-13");
});
