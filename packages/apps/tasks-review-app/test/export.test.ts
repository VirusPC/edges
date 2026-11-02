import { expect, it } from "vitest";
import { applyProjectDrop, exportReviewRows } from "../src/export.ts";
import type { ReviewItem } from "../src/types.ts";

it("source-less review rows preserve generic group values without status writes", () => {
  const items: ReviewItem[] = [{stem:"task",current:"one",suggested:"one",status:"todo"}];
  expect(exportReviewRows(items)[0]).toEqual({stem:"task",current:"one",suggested:"one",action:"keep",note:""});
  const moved=applyProjectDrop(items,"task","two");
  expect(moved[0]?.status).toBe("todo");
  expect(exportReviewRows(moved)[0]?.action).toBe("move");
  expect("status" in exportReviewRows(moved)[0]!).toBe(false);
});
it("duplicate stems move independently between real Projects within one scope", () => {
  const source={scope:".",purpose:"maintenance" as const};
  const other={scope:"child",purpose:"maintenance" as const};
  const groups=[
    {id:"root",source,title:"Unassigned"},
    {id:"p",project:"2026-11-02--P",source,title:"P"},
    {id:"q",project:"2026-11-02--P/projects/2026-11-02--Q",source,title:"Q"},
    {id:"other",project:"2026-11-02--P",source:other,title:"Other scope"},
  ];
  const items=[
    {id:"p-task",stem:"same",current:"p",suggested:"p",project:groups[1]!.project,source},
    {id:"q-task",stem:"same",current:"q",suggested:"q",project:groups[2]!.project,source},
  ];
  expect(applyProjectDrop(items,"p-task","other",groups)).toEqual(items);
  const moved=applyProjectDrop(items,"p-task","q",groups);
  expect(moved[0]?.suggested).toBe("q");
  expect(moved[1]).toEqual(items[1]);
  expect(exportReviewRows(moved,groups)[0]).toMatchObject({stem:"same",current:groups[1]!.project,suggested:groups[2]!.project,source,destination:source,action:"move"});
  const returned=applyProjectDrop(items,"p-task","root",groups);
  expect(exportReviewRows(returned,groups)[0]?.suggested).toBeNull();
});
it("a domain board may move into a Project but cannot be an unsupported destination",()=>{
  const domain={scope:".",purpose:"domain" as const};
  const maintenance={scope:".",purpose:"maintenance" as const};
  const groups=[{id:"d",source:domain,title:"Scope"},{id:"p",source:maintenance,project:"P",title:"P"}];
  const item={stem:"same",id:"d-task",source:domain,current:"d",suggested:"d"};
  expect(applyProjectDrop([item],item.id,"p",groups)[0]?.suggested).toBe("p");
  const inProject={...item,source:maintenance,project:"P",current:"p",suggested:"p"};
  expect(applyProjectDrop([inProject],item.id,"d",groups)).toEqual([inProject]);
});
