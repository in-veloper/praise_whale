import { RouteProp, useRoute } from '@react-navigation/native'
import LottieView from 'lottie-react-native'
import { JSX, useEffect, useRef, useState } from 'react'
import { Alert, Dimensions, Image, ImageBackground, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DropDownPicker from 'react-native-dropdown-picker'
import { MMKV } from 'react-native-mmkv'
import { usePraiseStore } from '../store/store'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import RNFS from 'react-native-fs'
import ViewShot from 'react-native-view-shot'
import { CameraRoll } from '@react-native-camera-roll/camera-roll'

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
    const [stickerType, setStickerType] = useState<string>('whale')
    const [countDropDownOpen, setCountDropDownOpen] = useState(false)
    const [stickerDropDownOpen, setStickerDropDownOpen] = useState(false)
    const [value, setValue] = useState<number>(30)
    const { people, updateStickers, updateStickerType } = usePraiseStore()
    const [items, setItems] = useState([
        { label: '10개', value: 10 },
        { label: '20개', value: 20 },
        { label: '30개', value: 30 }
    ])
    const [stickerItems, setStickerItems] = useState([
        { label: '고래', value: 'whale' },
        { label: '불가사리', value: 'starfish' },
        { label: '상어', value: 'shark' },
        { label: '게', value: 'crab' },
        { label: '문어', value: 'octopus' }
    ])

    const shotRef = useRef<any>(null)

    const getStickerImage = () => {
        switch (stickerType) {
            case 'starfish':
                return require('../../assets/image/starfish_sticker.png')
            case 'shark':
                return require('../../assets/image/shark_sticker.png')
            case 'crab':
                return require('../../assets/image/crab_sticker.png')
            case 'octopus':
                return require('../../assets/image/octopus_sticker.png')
            default:
                return require('../../assets/image/whale_sticker.png')
        }
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

    const handleCountChange = (count: number) => {
        setBubbleCount(count)
        setValue(count)
    }

    useEffect(() => {
        const foundPerson = people.find(p => p.id === person.id)
        if(foundPerson) {
            const stickers = foundPerson.stickers[bubbleCount] || []
            setFilled(stickers)
            setStickerType(foundPerson.stickerType)
        }else{
            setFilled([])
            setStickerType('whale')
        }
    }, [person.id, bubbleCount])

    const handlePress = (index: number) => {
        setFilled((prev) => {
            const updated = [...prev]
            const existingIndex = updated.findIndex(sticker => sticker.index === index)

            if(existingIndex !== -1) {
                updated[existingIndex].filled = !updated[existingIndex].filled
            }else{
                updated.push({ index, filled: true })
            }

            updateStickers(person.id, bubbleCount, updated)

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
        if (bubbleCount === 10) return 60
        if (bubbleCount === 20) return 60
        return 50
    }

    const handleStickerTypeChange = (type: string) => {
        setStickerType(type)
        updateStickerType(person.id, type)
    }

    const getParticle = (name: string): string => {
        const lastChar = name.charCodeAt(name.length - 1)
        const isKorean = (lastChar >= 0xAC00 && lastChar <= 0xD7A3)

        if(!isKorean) return '를'

        const hasFinalconsonant = (lastChar - 0xAC00) % 28 !== 0
        return hasFinalconsonant ? '을' : '를'
    }

    const requestStoragePermission = async () => {
        if(Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: '저장소 권한 요청',
                    message: '스크린샷을 저장하려면 저장소 권한이 필요합니다',
                    buttonNeutral: '나중에',
                    buttonNegative: '취소',
                    buttonPositive: '허용'
                }
            )
            return granted === PermissionsAndroid.RESULTS.GRANTED
        }
        return true
    }

    const captureStickerBoard = async () => {
        const hasPermission = await requestStoragePermission()
        if(!hasPermission) {
            Alert.alert('저장소 권한이 없습니다')
            return
        }

        shotRef.current.capture().then((uri: any) => {
            const filePath = `${RNFS.DownloadDirectoryPath}/sticker_board_${Date.now()}.png`
            RNFS.moveFile(uri, filePath)
                .then(() => {
                    Alert.alert('스크린샷이 갤러리에 저장되었습니다')
                    if(Platform.OS === 'android') {
                        CameraRoll.save(filePath, { type: 'photo' })
                    }
                })
                .catch(error => {
                    console.log('파일 저장 오류', error)
                    Alert.alert('스크린샷 저장 중 오류가 발생했습니다')
                })
        }).catch((error: any) => {
            console.log("캡처 오류", error)
            Alert.alert("캡처 중 오류가 발생했습니다")
        })
    }

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
                                source={getStickerImage()}
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
            <View style={styles.topAdBanner}>
                <BannerAd
                    unitId={TestIds.BANNER}
                    // unitId="ca-app-pub-4250906367423857/2294027788"
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: true
                    }}
                    onAdFailedToLoad={(error) => {
                        console.log('배너 광고 Load 실패 : ', error)
                    }}
                />
            </View>
            {/* <Image source={require('')} style={styles.background} resizeMode="cover" /> */}
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <DropDownPicker
                        open={countDropDownOpen}
                        value={value}
                        items={items}
                        setOpen={setCountDropDownOpen}
                        setValue={setValue}
                        setItems={setItems}
                        onChangeValue={(count) => handleCountChange(count as number)}
                        containerStyle={{ width: 150 }}
                        style={{ backgroundColor: '#FFF' }}
                        dropDownContainerStyle={{ backgroundColor: '#FFF' }}
                        labelStyle={{ fontWeight: 'bold', color: '#000' }}
                        textStyle={{ fontSize: 15 }}
                    />
                    <DropDownPicker
                        open={stickerDropDownOpen}
                        value={stickerType}
                        items={stickerItems}
                        setOpen={setStickerDropDownOpen}
                        setValue={setStickerType}
                        setItems={setStickerItems}
                        onChangeValue={(type) => handleStickerTypeChange(type ?? 'whale')}
                        containerStyle={{ width: 150 }}
                        style={{ backgroundColor: '#FFF' }}
                        dropDownContainerStyle={{ backgroundColor: '#FFF' }}
                        labelStyle={{ fontWeight: 'bold', color: '#000' }}
                        textStyle={{ fontSize: 15 }}
                    />
                    <TouchableOpacity onPress={captureStickerBoard}>
                        <MaterialIcons name="screenshot" size={35} color="#333" />
                    </TouchableOpacity>
                </View>
                <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.9 }}>
                    <View style={styles.overlay}>
                        <View style={styles.titleCard}>
                            <Text style={styles.title}>{person.name + getParticle(person.name)} 칭찬해 주세요</Text>
                            <Image 
                                source={require('../../assets/image/clapping.png')}
                                style={{
                                    height: 25,
                                    width: 25,
                                    resizeMode: 'contain'
                                }}
                            />
                        </View>
                        {<View style={styles.bubbleContainer}>{renderBubbles()}</View>}
                    </View>
                </ViewShot>
            </View>
            <View style={styles.bottomAdBanner}>
                <BannerAd
                    unitId={TestIds.BANNER}
                    // unitId="ca-app-pub-4250906367423857/9843546440"
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: true
                    }}
                    onAdFailedToLoad={(error) => {
                        console.log('배너 광고 Load 실패 : ', error)
                    }}
                />
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
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        marginTop: -90
    },
    topAdBanner: {
        height: 60,
        top: 0,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    overlay: { 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 20
    },
    titleCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#BEE1ED',
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        alignItems: 'center',
        width: width * 0.9,
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center'
    },
    title: { 
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#333'
    },
    headerRow: {
        marginTop: 20,
        marginBottom: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10
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
    bottomAdBanner: {
        position: 'absolute',
        height: 60,
        bottom: 0,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center'
    }
})
