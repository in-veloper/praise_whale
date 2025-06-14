import { MMKV } from "react-native-mmkv"
import { create } from "zustand"
import uuid from 'react-native-uuid'

export interface StickerState {
    index: number
    filled: boolean
}

export interface PraisePerson {
    id: string
    name: string
    stickerCount: number
    stickers: {
        [key: number]: StickerState[]
    }
    stickerType: string
}

export interface CompletedStickerBoard {
    id: string
    name: string
    stickerCount: number
    completedAt: string
    reward?: string
}

interface PraiseStore {
    people: PraisePerson[]
    completedBoards: { [key: string]: CompletedStickerBoard[] }
    addPerson: (name: string) => void
    removePerson: (id: string) => void
    updateStickers: (id: string, count: number, stickers: StickerState[]) => void
    updateStickerType: (id: string, type: string) => void
    loadPeople: () => void
    addCompletedBoard: (personId: string, board: CompletedStickerBoard) => void
    loadCompletedBoards: (personId: string) => void
    updateCompletedBoard: (personId: string, id: string, reward: string) => void
}

const storage = new MMKV()
const STORAGE_KEY = 'praise_people'

export const usePraiseStore = create<PraiseStore>((set) => ({
    people: [],
    completedBoards: {},
    addPerson: (name) => set((state) => {
        const newPerson: PraisePerson = {
            id: uuid.v4().toString(),
            name,
            stickerCount: 0,
            stickerType: 'whale',
            stickers: { 10: [], 20: [], 30: [] }
        }
        const updatedPeople = [...state.people, newPerson]
        storage.set(STORAGE_KEY, JSON.stringify(updatedPeople))
        return { people: updatedPeople }
    }),
    removePerson: (id) => set((state) => {
        const updatedPeople = state.people.filter(p => p.id !== id)
        storage.set(STORAGE_KEY, JSON.stringify(updatedPeople))
        return { people: updatedPeople }
    }),
    updateStickers: (id, count, stickers) => set((state) => {
        const updatedPeople = state.people.map(p => 
            p.id === id ? { ...p, stickers: { ...p.stickers, [count]: stickers } } : p
        )
        storage.set(STORAGE_KEY, JSON.stringify(updatedPeople))
        return { people: updatedPeople }
    }),
    updateStickerType: (id, type) => set((state) => {
        const updatedPeople = state.people.map(p => 
            p.id === id ? {...p, stickerType: type} : p
        )
        storage.set(STORAGE_KEY, JSON.stringify(updatedPeople))
        return { people: updatedPeople }
    }),
    loadPeople: () => set(() => {
        const saved = storage.getString(STORAGE_KEY)
        return { people: saved ? JSON.parse(saved) : []}
    }),
    addCompletedBoard: (personId, board) => set((state) => {
        const updatedBoards = {
            ...state.completedBoards,
            [personId]: [...(state.completedBoards[personId] || []), board]
        }
        storage.set(`completed_boards_${personId}`, JSON.stringify(updatedBoards))
        return { completedBoards: updatedBoards }
    }),
    loadCompletedBoards: (personId) => set((state) => {
        const saved = storage.getString(`completed_boards_${personId}`)
        return { completedBoards: saved ? JSON.parse(saved) : [] }
    }),
    updateCompletedBoard: (personId, id, reward) => set((state) => {
                const personBoards = state.completedBoards[personId] || []
        const updatedBoards = personBoards.map((board) => 
            board.id === id ? { ...board, reward } : board
        )
        storage.set(`completed_boards_${personId}`, JSON.stringify(updatedBoards))
        return { completedBoards: { ... state.completedBoards, [personId]: updatedBoards } }
    })
}))