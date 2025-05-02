import { RouteProp, useRoute } from "@react-navigation/native"
import { JSX, useEffect, useState } from "react"
import { Dimensions, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { MMKV } from "react-native-mmkv"

const { width } = Dimensions.get('window')
const storage = new MMKV()

interface Person {
    id: string
    name: string
    stickerCount: number
}

const StickerBoard = () => {
    const route = useRoute<RouteProp<{ params: { person: Person } }, 'params'>>()
    const { person } = route.params
    const [bubbleCount, setBubbleCount] = useState(30)
    const [filled, setFilled] = useState<boolean[]>(Array(bubbleCount).fill(false))

    useEffect(() => {
        const saved = storage.getString(`stickers_${person.id}`)
        if(saved) {
            const parsed = JSON.parse(saved)
            setBubbleCount(parsed.count)
            setFilled(parsed.filled)
        }else{
            setFilled(Array(bubbleCount).fill(false))
        }
    }, [person.id])

    const saveToStorage = (nextFilled: boolean[], count: number) => {
        storage.set(`stickers_${person.id}`, JSON.stringify({ filled: nextFilled, count }))
    }

    const handleCountChange = (count: number) => {
        const newFilled = Array(count).fill(false)
        setBubbleCount(count)
        setFilled(newFilled)
        saveToStorage(newFilled, count)
    }

    const handlePress = (index: number) => {
        setFilled((prev) => {
            const updated = [...prev]
            updated[index] = true
            saveToStorage(updated, bubbleCount)
            return updated
        })
    }

    const getSize = () => {
        if (bubbleCount === 10) return 50;
        if (bubbleCount === 20) return 42;
        return 36;
    };

    const renderBubbles = () => {
        const bubbleSize = getSize();
        const bubbles: JSX.Element[] = [];
    
        for (let i = 0; i < bubbleCount; i++) {
            bubbles.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => {
                        console.log(i)
                        handlePress(i)}
                    }
                    style={{
                        width: bubbleSize,
                        height: bubbleSize,
                        borderRadius: bubbleSize / 2,
                        margin: 6,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#DDD',
                    }}
                >
                    {filled[i] && (
                        <Image
                            source={require('../../assets/image/whale_sticker.png')}
                            style={{ width: bubbleSize * 0.9, height: bubbleSize * 0.9 }}
                            resizeMode="contain"
                        />
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
        position: 'relative' 
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
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
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
    bubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 4,
        backgroundColor: '#ddd',
    },
    activeBubble: {
        backgroundColor: '#FFD700',
    },
})
  