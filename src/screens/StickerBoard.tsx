import { RouteProp, useRoute } from '@react-navigation/native'
import LottieView from 'lottie-react-native'
import { JSX, useEffect, useState } from 'react'
import { Dimensions, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MMKV } from 'react-native-mmkv'

const { width } = Dimensions.get('window')
const storage = new MMKV()

interface Person {
    id: string
    name: string
    stickerCount: number
}

interface StickerState {
    index: number
    filled: boolean
}

const StickerBoard = () => {
    const route = useRoute<RouteProp<{ params: { person: Person } }, 'params'>>()
    const { person } = route.params
    const [bubbleCount, setBubbleCount] = useState(30)
    const [filled, setFilled] = useState<StickerState[]>([])
    const [animatingIndex, setAnimatingIndex] = useState<number | null>(null)

    const getStoreKey = (personId: string, count: number) => {
        return `stickers_${personId}_${count}`
    }

    useEffect(() => {
        const saved = storage.getString(`stickers_${person.id}`)
        if(saved) {
            const parsed = JSON.parse(saved)
            setBubbleCount(parsed.count)

            const loadedFilled: StickerState[] = parsed.stickers || []
            setFilled(loadedFilled)
        }else{
            setFilled([])
        }
    }, [person.id])

    const saveToStorage = (stickers: StickerState[], count: number) => {
        const key = getStoreKey(person.id, count)
        storage.set(key, JSON.stringify({ stickers, count }))
    }

    const loadFromStorage = (count: number) => {
        const key = getStoreKey(person.id, count)
        const saved = storage.getString(key)

        if(saved) {
            const parsed = JSON.parse(saved)
            setBubbleCount(parsed.count)
            const loadedFilled: StickerState[] = parsed.stickers || []
            setFilled(loadedFilled)
        }else{
            setFilled([])
        }
    }

    const handleCountChange = (count: number) => {
        setBubbleCount(count)
        loadFromStorage(count)
    }

    useEffect(() => {
        loadFromStorage(bubbleCount)
    }, [person.id])

    const handlePress = (index: number) => {
        setFilled((prev) => {
            const updated = [...prev]
            const existingIndex = updated.findIndex(sticker => sticker.index === index)

            if(existingIndex !== -1) {
                updated[existingIndex].filled = !updated[existingIndex].filled
            }else{
                updated.push({ index, filled: true })
            }

            saveToStorage(updated, bubbleCount)

            if(updated[existingIndex]?.filled || existingIndex === -1) {
                setAnimatingIndex(index)
                setTimeout(() => {
                    setAnimatingIndex(null)
                }, 1000)
            }

            return updated
        })
    }

    const getSize = () => {
        if (bubbleCount === 10) return 69
        if (bubbleCount === 20) return 68
        return 54
    };

    const renderBubbles = () => {
        const bubbleSize = getSize()
        const bubbles: JSX.Element[] = []
    
        for (let i = 0; i < bubbleCount; i++) {
            const isFilled = filled.find(sticker => sticker.index === i)?.filled || false

            bubbles.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => handlePress(i)}
                    style={{
                        width: bubbleSize,
                        height: bubbleSize,
                        borderRadius: bubbleSize / 2,
                        margin: 6,
                        marginLeft: bubbleCount === 10 ? 40 : undefined,
                        marginRight: bubbleCount === 10 ? 40 : undefined,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#FFF',
                        borderColor: '#BEE1ED',
                        borderWidth: 1
                    }}
                >
                    {isFilled && (
                        <>
                            <Image
                                source={require('../../assets/image/whale_sticker.png')}
                                style={{ 
                                    width: bubbleSize * 0.9, 
                                    height: bubbleSize * 0.9,
                                    position: 'absolute',
                                    zIndex: 1 
                                }}
                                resizeMode="contain"
                            />
                            {animatingIndex === i && (
                                <LottieView
                                    source={require('../../assets/lottie/sticker_effect.json')}
                                    autoPlay
                                    loop
                                    style={{
                                        width: bubbleSize * 1.5,
                                        height: bubbleSize * 1.5,
                                        position: 'absolute',
                                        zIndex: 2
                                    }}
                                />
                            )}
                        </>
                    )}
                </TouchableOpacity>
            )
        }
    
        return (
            <ImageBackground 
                source={require('../../assets/image/wave_background.png')} 
                style={styles.card}
                imageStyle={{ borderRadius: 16, opacity: 0.2 }}
            >
                {bubbles}
            </ImageBackground>
        )
    }
    
    return (
        <View style={styles.container}>
            {/* <Image source={require('')} style={styles.background} resizeMode="cover" /> */}
            <View style={styles.overlay}>
                <Text style={styles.title}>{person.name}님의 칭찬 스티커판</Text>

                <View style={styles.buttonRow}>
                    {[10, 20, 30].map((count) => (
                        <TouchableOpacity key={count} style={[styles.countButton, bubbleCount === count && styles.selectedButton]} onPress={() => handleCountChange(count)}>
                            <Text style={styles.countText}>{count}개</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {<View style={styles.bubbleContainer}>{renderBubbles()}</View>}
            </View>
        </View>
    )
}

export default StickerBoard

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        position: 'relative',
        backgroundColor: '#FFF'
    },
    background: { 
        position: 'absolute', 
        width: '100%', 
        height: '100%' 
    },
    overlay: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20 
    },
    title: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 20 
    },
    buttonRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    countButton: {
        backgroundColor: '#eee',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 5,
        borderRadius: 8,
    },
    selectedButton: {
        backgroundColor: '#227DBD',
    },
    countText: {
        color: '#000',
        fontWeight: 'bold',
    },
    bubbleContainer: {
        alignItems: 'center',
    },
    card: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
    },
    bubbleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 6,
    },
    firstRow: {
        flexDirection: 'row',
        justifyContent: 'space-between', 
        width: width - 60, 
    },
    leftGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginLeft: 20
    },
    rightGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginRight: -7
    },
    activeBubble: {
        backgroundColor: '#FFD700',
    },
})
  