import { useNavigation } from "@react-navigation/native"
import { useState } from "react"
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import uuid from 'react-native-uuid'

interface PraisePerson {
    id: string
    name: string
    stickerCount: number
}

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const [people, setPeople] = useState<PraisePerson[]>([])
    const [newName, setNewName] = useState('')

    const handleAddPerson = () => {
        if(!newName.trim()) return

        setPeople(prev => [
            ...prev,
            { id: uuid.v4().toString(), name: newName.trim(), stickerCount: 0 }
        ])

        setNewName('')
    }

    const handleCardPress = (person: PraisePerson) => {
        navigation.navigate('StickerBoard', { person })
    }

    const renderItem = ({ item }: { item: PraisePerson }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.count}>스티커 : {item.stickerCount}</Text>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
            <Text style={styles.title}>누구를 칭찬하고 싶나요?</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="이름 입력"
                    style={styles.input}
                />
                <TouchableOpacity onPress={handleAddPerson} style={styles.addButton}>
                    <Text style={styles.addText}>추가</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={people}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    )
}

export default HomeScreen

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20 
    },
    title: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 20 
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
        marginTop: 20 
    },
    card: {
        backgroundColor: '#f2f2f2',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    name: { 
        fontSize: 16, 
        fontWeight: '600' 
    },
    count: { 
        fontSize: 14, 
        marginTop: 4, 
        color: '#555' 
    },
})
  