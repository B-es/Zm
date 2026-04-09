import { describe, it, expect, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useRoomStore } from "@/entities/room/room.store";

describe("room.store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe("setRoom", () => {
        it("должен установить комнату с корректными полями", () => {
            const store = useRoomStore();

            store.setRoom("Моя комната", "secret123");

            expect(store.room).not.toBeNull();
            expect(store.room!.title).toBe("Моя комната");
            expect(store.room!.password).toBe("secret123");
            expect(store.room!.id).toBeDefined();
            expect(store.room!.createdBy).toBe("");
            expect(store.room!.createdAt).toBeDefined();
        });

        it("должен генерировать уникальный id для каждой комнаты", () => {
            const store = useRoomStore();

            store.setRoom("Комната 1", "pass1");
            const id1 = store.room!.id;

            store.setRoom("Комната 2", "pass2");
            const id2 = store.room!.id;

            expect(id1).not.toBe(id2);
        });
    });

    describe("clearRoom", () => {
        it("должен очистить комнату", () => {
            const store = useRoomStore();
            store.setRoom("Тест", "pass");
            expect(store.isRoomSet).toBe(true);

            store.clearRoom();

            expect(store.room).toBeNull();
        });
    });

    describe("getters", () => {
        it("isRoomSet должен возвращать true когда комната установлена", () => {
            const store = useRoomStore();
            store.setRoom("Тест", "pass");
            expect(store.isRoomSet).toBe(true);
        });

        it("isRoomSet должен возвращать false когда комната не установлена", () => {
            const store = useRoomStore();
            expect(store.isRoomSet).toBe(false);
        });

        it("roomId должен возвращать id комнаты", () => {
            const store = useRoomStore();
            store.setRoom("Тест", "pass");
            expect(store.roomId).toBe(store.room!.id);
        });

        it("roomId должен возвращать пустую строку если комната не установлена", () => {
            const store = useRoomStore();
            expect(store.roomId).toBe("");
        });

        it("roomTitle должен возвращать title комнаты", () => {
            const store = useRoomStore();
            store.setRoom("Моя комната", "pass");
            expect(store.roomTitle).toBe("Моя комната");
        });

        it("roomTitle должен возвращать пустую строку если комната не установлена", () => {
            const store = useRoomStore();
            expect(store.roomTitle).toBe("");
        });
    });
});
