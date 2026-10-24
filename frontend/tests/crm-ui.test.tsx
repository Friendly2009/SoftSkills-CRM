import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  within,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CrmApp } from "../src/crm/app/CrmApp";
import { Routes, Route } from "react-router-dom";
function mount(path = "/dashboard/clients") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/*" element={<CrmApp />} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("interactive CRM", () => {
  it("creates a client, filters the list and persists across remount", async () => {
    const user = userEvent.setup();
    const view = mount();
    await user.click(screen.getByRole("button", { name: "Добавить" }));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByLabelText(/Имя|Название|ФИО/),
      "Тестовый Клиент",
    );
    await user.type(
      within(dialog).getByLabelText(/Телефон/),
      "+7 900 999-99-99",
    );
    await user.click(within(dialog).getByRole("button", { name: "Сохранить" }));
    await user.type(screen.getByLabelText("Поиск по списку"), "Тестовый");
    expect(
      screen.getByRole("button", { name: "Тестовый Клиент" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Александра Миронова" }),
    ).toBeNull();
    view.unmount();
    mount();
    expect(
      screen.getByRole("button", { name: "Тестовый Клиент" }),
    ).toBeTruthy();
  });
  it("payment updates card, transaction list and survives reload", async () => {
    const user = userEvent.setup();
    mount("/dashboard/clients/c1");
    await user.click(screen.getByRole("button", { name: "Принять оплату" }));
    const dialog = screen.getByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Сумма оплаты"));
    await user.type(within(dialog).getByLabelText("Сумма оплаты"), "500");
    await user.click(
      within(dialog).getByRole("button", { name: "Принять оплату" }),
    );
    const saved = JSON.parse(localStorage.getItem("softskills.crm.demo.v1")!);
    expect(
      saved.records.clients.find((c: { id: string }) => c.id === "c1").balance,
    ).toBe(5300);
    expect(saved.records.transactions[0].amount).toBe(500);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("moves leads using the accessible selector", async () => {
    const user = userEvent.setup();
    mount("/dashboard/leads");
    await user.selectOptions(
      screen.getByLabelText("Этап: Елена Новикова"),
      "Получена оплата",
    );
    const saved = JSON.parse(localStorage.getItem("softskills.crm.demo.v1")!);
    expect(
      saved.records.clients.some(
        (c: { name: string }) => c.name === "Елена Новикова",
      ),
    ).toBe(true);
  });
  it("support is a dismissible placeholder and excluded navigation is absent", async () => {
    const user = userEvent.setup();
    mount();
    expect(
      screen.queryByRole("link", { name: /Маркетплейс|Бизнес-клуб|Обучение/ }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Поддержка" }));
    expect(screen.getByRole("dialog", { name: "Поддержка" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Поддержка" }),
    );
  });
  it("malformed persisted state falls back to demo fixtures", () => {
    localStorage.setItem("softskills.crm.demo.v1", "{bad");
    mount();
    expect(
      screen.getByRole("button", { name: "Александра Миронова" }),
    ).toBeTruthy();
  });
  it("settings update the header organization name", async () => {
    const user = userEvent.setup();
    mount("/dashboard/settings");
    await user.clear(screen.getByLabelText("Название организации"));
    await user.type(
      screen.getByLabelText("Название организации"),
      "Новая школа",
    );
    await user.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(screen.getByText("Новая школа")).toBeTruthy();
  });
  it("calendar controls switch the period and open a lesson form", async () => {
    mount("/dashboard/schedule");
    fireEvent.click(screen.getByRole("button", { name: "День" }));
    fireEvent.click(screen.getByRole("button", { name: "Добавить урок" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText(/Начало/)).toBeTruthy();
  });
});
