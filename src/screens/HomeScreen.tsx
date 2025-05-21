import { useNavigation } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { PraisePerson, StickerState, usePraiseStore } from '../store/store'

const HomeScreen = () => {
    const navigation = useNavigation<any>()
    const [newName, setNewName] = useState('')
    const { people, addPerson, removePerson, loadPeople } = usePraiseStore()

    const handleAddPerson = () => {
        if(!newName.trim()) return

        addPerson(newName.trim())
        setNewName('')
    }

    const handleCardPress = (person: PraisePerson) => {
        navigation.navigate('StickerBoard', { person })
    }

    useEffect(() => {
        loadPeople()
    }, [])

    const handleDelete = (id: string) => {
        removePerson(id)
    }

    const getStickerImage = (stickerType: string) => {
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

    const getStickerCount = (stickers: { [key: number]: StickerState[] }, count: number): number => {
        return stickers[count]?.filter(sticker => sticker.filled).length || 0
    }

    const renderItem = ({ item }: { item: PraisePerson }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
            <View style={styles.cardLeft}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {(() => {
                        const allZero = [10, 20, 30].every(
                            (count) => getStickerCount(item.stickers, count) === 0
                        )

                        if(allZero) {
                            return (
                                <Text style={styles.count}>아직 받은 칭찬이 없어요!</Text>
                            )
                        }

                        return [10, 20, 30].map((count, idx) => (
                            <View key={count} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: idx === 0 ? 0 : 15 }}>
                                <Image
                                    source={getStickerImage(item.stickerType)}
                                    style={{ height: 30, width: 30 }}
                                />
                                <Text style={styles.count}>
                                    {getStickerCount(item.stickers, count)} / {count}
                                </Text>
                            </View>
                        ))
                    })()}
                </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButtonInside}>
                <MaterialCommunityIcons name="delete-circle" size={30} color="#CD5C5C"/>
            </TouchableOpacity>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
            <View style={styles.topAdBanner}>
                <BannerAd
                    unitId={TestIds.BANNER}
                    // unitId="ca-app-pub-4250906367423857/9562004092"
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
                <Text style={styles.title}>칭찬은 고래도 춤추게 해요</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="칭찬할 이름을 입력해 주세요!"
                        style={[styles.input, { textAlignVertical: 'center' }]}
                        onSubmitEditing={handleAddPerson}
                        multiline={false}
                        returnKeyType='done'
                    />
                    <TouchableOpacity onPress={handleAddPerson} style={styles.addButton}>
                        <Text style={styles.addText}>추가</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={people}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.list, { paddingBottom: 30 }]}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: 200 }} />}
                />
            </View>
            <View style={styles.bottomAdBanner}>
                <BannerAd
                    unitId={TestIds.BANNER}
                    // unitId="ca-app-pub-4250906367423857/1128980300"
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

export default HomeScreen

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#FFF'
    },
    topAdBanner: {
        height: 60,
        top: 0,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    contentContainer: {
        padding: 20,
    },
    title: { 
        fontSize: 20, 
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'OAGothic-ExtraBold'
    },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
    },
    addButton: {
        backgroundColor: '#227DBD',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addText: { 
        color: 'white', 
        fontWeight: 'bold' 
    },
    list: { 
        marginTop: 20,
    },
    card: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderColor: '#BEE1ED',
        borderWidth: 1.5,
        elevation: 5,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    cardLeft: {
        flex: 1,
    },
    deleteButtonInside: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginLeft: 10,
    },
    name: { 
        fontSize: 16, 
        fontWeight: '600',
        marginBottom: 5
    },
    count: { 
        fontSize: 14, 
        color: '#555',
        marginLeft: 5,
        fontWeight: 'bold'
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
