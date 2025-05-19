import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import LottieView from 'lottie-react-native'
import { JSX, useEffect, useRef, useState } from 'react'
import { Alert, Dimensions, Image, ImageBackground, Modal, PermissionsAndroid, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import DropDownPicker from 'react-native-dropdown-picker'
import { MMKV } from 'react-native-mmkv'
import { usePraiseStore } from '../store/store'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Entypo from 'react-native-vector-icons/Entypo'
import RNFS from 'react-native-fs'
import ViewShot from 'react-native-view-shot'
import { CameraRoll } from '@react-native-camera-roll/camera-roll'
import uuid from 'react-native-uuid'

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
    const navigation = useNavigation<any>()
    const route = useRoute<RouteProp<{ params: { person: Person } }, 'params'>>()
    const { person } = route.params
    const [bubbleCount, setBubbleCount] = useState(30)
    const [filled, setFilled] = useState<StickerState[]>([])
    const [animatingIndex, setAnimatingIndex] = useState<number | null>(null)
    const [stickerType, setStickerType] = useState<string>('whale')
    const [countDropDownOpen, setCountDropDownOpen] = useState(false)
    const [stickerDropDownOpen, setStickerDropDownOpen] = useState(false)
    const [value, setValue] = useState<number>(30)
    const [isCompleted, setIsCompleted] = useState(false)
    const [isListModalOpen, setIsListModalOpen] = useState(false)
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)
    const [rewardText, setRewardText] = useState<string>('')
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
    const [selectedReward, setSelectedReward] = useState<string>('')
    const { people, updateStickers, updateStickerType, addCompletedBoard, completedBoards, loadCompletedBoards, updateCompletedBoard } = usePraiseStore()
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
            checkCompletion(updated)

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

    const handleBack = () => {
        navigation.goBack()
    }

    const resetStickers = () => {
        Alert.alert(
            '초기화',
            `칭찬 스티커를 초기화하시겠습니까?`,
            [
                {
                    text: '아니오',
                    style: 'cancel'
                },
                {
                    text: '예',
                    onPress: () => {
                        setFilled([])
                        updateStickers(person.id, bubbleCount, [])
                    }
                }
            ]
        )
    }

    const checkCompletion = (stickers: StickerState[]) => {
        if(stickers.length === bubbleCount && stickers.every(sticker => sticker.filled)) {
            const completedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
            addCompletedBoard({
                id: uuid.v4().toString(),
                name: person.name,
                stickerCount: bubbleCount,
                completedAt
            })

            setIsCompleted(true)
        }
    }

    const handleConfirmCompleted = () => {
        setIsCompleted(false)
    }
    
    const handleResetCompleted = () => {
        setFilled([])
        updateStickers(person.id, bubbleCount, [])
        setIsCompleted(false)
    }

    const handleOpenCompletedStickerBoard = () => {
        setIsListModalOpen(true)
    }

    useEffect(() => {
        loadCompletedBoards()
    }, [])

    const handleOpenRewardModal = (id: string, reward: string) => {
        setSelectedBoardId(id)
        setSelectedReward(reward)
        setRewardText(reward)
        setIsRewardModalOpen(true)
    }

    const handleCloseRewardModal = () => {
        setIsRewardModalOpen(false)
    }

    const handleSaveReward = () => {
        if(selectedBoardId) {
            updateCompletedBoard(selectedBoardId, rewardText)
        }
        setIsRewardModalOpen(false)
        setRewardText('')
        setSelectedBoardId(null)
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
            <View style={styles.contentContainer}>
                <View style={styles.headerButtonRow}>
                    <View style={styles.headerTitleContainer}>
                        <Image
                            source={require('../../assets/image/whale_sticker.png')}
                            style={styles.headerImage}
                        />
                        <Text style={styles.headerTitle}>칭찬고래</Text>
                    </View>
                    <View style={styles.headerButtonGroup}>
                        <TouchableOpacity onPress={captureStickerBoard} style={styles.headerButton}>
                            <MaterialCommunityIcons name="cellphone-screenshot" size={20} color="#FFF" />
                            <Text style={styles.headerButtonText}>캡처</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleOpenCompletedStickerBoard} style={styles.headerButton}>
                            <Entypo name="list" size={20} color="#FFF" />
                            <Text style={styles.headerButtonText}>완료 목록</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.headerDropdownRow}>
                    <View style={styles.dropdownContainer}>
                        <Text style={styles.dropdownLabel}>스티커 수</Text>
                        <DropDownPicker
                            open={countDropDownOpen}
                            value={value}
                            items={items}
                            setOpen={setCountDropDownOpen}
                            setValue={setValue}
                            setItems={setItems}
                            onChangeValue={(count) => handleCountChange(count as number)}
                            containerStyle={{ width: 100 }}
                            style={{ backgroundColor: '#FFF' }}
                            dropDownContainerStyle={{ backgroundColor: '#FFF' }}
                            labelStyle={{ fontWeight: 'bold', color: '#000' }}
                            textStyle={{ fontSize: 15 }}
                        />
                    </View>
                    <View style={styles.dropdownContainer}>
                        <Text style={styles.dropdownLabel}>스티커 모양</Text>
                        <DropDownPicker
                            open={stickerDropDownOpen}
                            value={stickerType}
                            items={stickerItems}
                            setOpen={setStickerDropDownOpen}
                            setValue={setStickerType}
                            setItems={setStickerItems}
                            onChangeValue={(type) => handleStickerTypeChange(type ?? 'whale')}
                            containerStyle={{ width: 120 }}
                            style={{ backgroundColor: '#FFF' }}
                            dropDownContainerStyle={{ backgroundColor: '#FFF' }}
                            labelStyle={{ fontWeight: 'bold', color: '#000' }}
                            textStyle={{ fontSize: 15 }}
                        />
                    </View>
                </View>
                <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.9 }}>
                    <View style={styles.overlay}>
                        {<View style={styles.bubbleContainer}>{renderBubbles()}</View>}
                    </View>
                </ViewShot>
                <View style={styles.bottomButtonArea}>
                    <TouchableOpacity onPress={handleBack} style={styles.bottomButton}>
                        <Text style={styles.buttonText}>이전으로</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={resetStickers} style={styles.bottomButton}>
                        <Text style={styles.buttonText}>초기화</Text>
                    </TouchableOpacity>
                </View>
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

            {isCompleted && (
                <Modal
                    transparent={true}
                    animationType='fade'
                    visible={isCompleted}
                    onRequestClose={() => setIsCompleted(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalText}>모든 스티커를 채웠어요!</Text>
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity onPress={handleConfirmCompleted} style={styles.modalButton}>
                                    <Text style={styles.modalButtonText}>확인</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleResetCompleted} style={styles.modalButton}>
                                    <Text style={styles.modalButtonText}>초기화</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {isListModalOpen && (
                <Modal
                    transparent={true}
                    animationType='fade'
                    visible={isListModalOpen}
                    onRequestClose={() => setIsListModalOpen(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.listModalContent}>
                            <Text style={styles.listModalTitle}>완료된 칭찬 스티커 목록</Text>
                            {completedBoards.length === 0 ? (
                                <Text style={styles.noCompletedText}>아직 완료된 스티커 목록이 없어요!</Text>
                            ) : (
                                completedBoards.map((board) => (
                                    <View key={board.id} style={[styles.completedCard, board.reward ? styles.rewardCompletedCard : null]}>
                                        <Text>
                                            {board.stickerCount}개짜리 스티커를 모두 채웠어요!
                                        </Text>
                                        <View style={styles.cardSecondRow}>
                                            <Text>{board.name}</Text>
                                            <Text>{board.completedAt}</Text>
                                        </View>
                                        <View style={styles.cardButtonRow}>
                                            <TouchableOpacity onPress={() => handleOpenRewardModal(board.id, board.reward || '')} style={styles.cardButton}>
                                                <Text style={styles.cardButtonText}>{board.reward ? '보상 완료' : '보상'}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.cardButton}>
                                                <Text style={styles.cardButtonText}>삭제</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                            <TouchableOpacity onPress={() => setIsListModalOpen(false)} style={styles.modalCloseButton}>
                                <Text style={styles.modalButtonText}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {isRewardModalOpen && (
                <Modal
                    transparent={true}
                    animationType='fade'
                    visible={isRewardModalOpen}
                    onRequestClose={handleCloseRewardModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.rewardModalContent}>
                            <TextInput
                                style={styles.rewardInput}
                                placeholder='어떤 보상을 해주었나요?'
                                value={rewardText}
                                onChangeText={setRewardText}
                                multiline={false}
                            />
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity onPress={handleSaveReward} style={styles.rewardModalButton}>
                                    <Text style={styles.modalButtonText}>확인</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCloseRewardModal} style={styles.rewardModalButton}>
                                    <Text style={styles.modalButtonText}>취소</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
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
        marginTop: -80
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerButtonGroup: {
        flexDirection: 'row',
        gap: 10,
        marginRight: 15
    },
    headerButtonRow: {
        flexDirection: 'row',
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginLeft: 10
    },
    headerImage: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    headerButton: {
        flexDirection: 'row',
        backgroundColor: '#227DBD',
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 5,
        gap: 5,
        elevation: 10,
    },
    headerButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    headerDropdownRow: {
        marginTop: 10,
        marginBottom: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 7
    },
    dropdownContainer: {
        alignItems: 'center',
        marginBottom: 5,
        flexDirection: 'row',
        gap: 7
    },
    dropdownLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
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
    cardSecondRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    cardButtonRow: {
        flexDirection: 'row',
        gap: 10,
        alignSelf: 'flex-end',
        marginTop: 5
    },
    cardButton: {
        backgroundColor: '#227DBD',
        borderRadius: 5,
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 5
    },
    cardButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    bottomButtonArea: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 15
    },
    bottomButton: {
        backgroundColor: '#227DBD',
        padding: 7,
        borderRadius: 7,
        alignItems: 'center',
        elevation: 10,
        paddingHorizontal: 15
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomAdBanner: {
        position: 'absolute',
        height: 60,
        bottom: 0,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalButtonContainer: {
        alignSelf: 'flex-end',
        flexDirection: 'row',
        gap: 10
    },
    modalButton: {
        backgroundColor: '#227DBD',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    modalButtonText: {
        color: '#FFF',
        fontSize: 16,
    },
    listModalContent: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        maxWidth: '90%',
    },
    listModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    completedCard: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#BEE1ED',
        padding: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 8,
        width: '100%',
        fontSize: 16,
        color: '#333',
    },
    rewardCompletedCard: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#BEE1ED',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        width: '100%',
        fontSize: 16,
        color: '#333',
    },
    noCompletedText: {
        fontSize: 16,
        color: '#999',
        marginBottom: 10,
    },
    modalCloseButton: {
        backgroundColor: '#227DBD',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginTop: 15,
    },
    rewardModalContent: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: width * 0.6,
    },
    rewardInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
        marginBottom: 15,
        width: '100%',
    },
    rewardModalButton: {
        backgroundColor: '#227DBD',
        paddingVertical: 5,
        paddingHorizontal: 7,
        borderRadius: 5,
        marginTop: 10,
    }
})
