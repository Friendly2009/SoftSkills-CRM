import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { ClientForm, emptyClient } from "./ClientForm";
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);
it("keeps a failed form open with the entered data and error", async () => {
  const close = vi.fn();
  render(
    <ClientForm
      client={emptyClient()}
      groups={[{ id: 1, name: "Группа А" }]}
      onClose={close}
      onSave={vi.fn().mockRejectedValue(new Error("Не сохранено"))}
    />,
  );
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Иван" } });
  fireEvent.click(screen.getByLabelText("Группа А"));
  fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Не сохранено"),
  );
  expect(screen.getByLabelText("Имя")).toHaveValue("Иван");
  expect(screen.getByLabelText("Группа А")).toBeChecked();
  expect(close).not.toHaveBeenCalled();
});
