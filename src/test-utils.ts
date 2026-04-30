import { mount, type VueWrapper, type DOMWrapper } from "@vue/test-utils";
import { createPinia, type Pinia } from "pinia";
import { type Component } from "vue";
import router from "@/router";
import { vi } from "vitest";

export function mountWithPlugins(
  component: Component,
  options: Record<string, unknown> = {},
): VueWrapper {
  const pinia = createPinia();
  return mount(component, {
    global: {
      plugins: [pinia, router],
      ...(options.global || {}),
    },
    ...options,
  });
}

export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function findByText(
  wrapper: VueWrapper,
  text: string,
): DOMWrapper<Element>[] {
  return wrapper.findAll("*").filter((el) => el.text().includes(text));
}

export function mockSupabaseCall(fn: (...args: unknown[]) => unknown) {
  return vi.fn().mockImplementation(fn);
}
