import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

// Table rows offer their actions on right-click (RowMenu); `rowText` is text in the row.
export async function chooseRowAction(user: UserEvent, rowText: string, action: string) {
  const row = (await screen.findByText(rowText)).closest("tr") as HTMLElement;
  await user.pointer({ keys: "[MouseRight]", target: row });
  await user.click(await screen.findByRole("menuitem", { name: action }));
}
