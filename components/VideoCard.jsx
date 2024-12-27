import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { icons } from '../constants';
import { Video } from 'expo-av'; // Make sure to import Video from expo-av

const VideoCard = ({ video: { title, thumbnail, video, creator: { studentID, avatar } } }) => {
    const [play, setPlay] = useState(false);
    const videoRef = React.useRef(null);

    const handlePlayback = async () => {
        if (videoRef.current) {
            if (play) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
            setPlay(!play);
        }
    };

    return (
        <View style={styles.cardContainer}>
            <View style={styles.rowContainer}>
                <View style={styles.avatarContainer}>
                    <Image 
                        source={{ uri: avatar }} 
                        style={styles.avatarImage} 
                        resizeMode='cover' 
                    />
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.titleContainer}>
                        <Text 
                            style={styles.titleText} 
                            numberOfLines={1}
                        >
                            {title || "No Title Available"}
                        </Text>
                        <Image 
                            source={icons.menu} 
                            style={styles.icon} 
                            resizeMode='contain' 
                        />
                    </View>
                    <Text 
                        style={styles.usernameText} 
                        numberOfLines={1}
                    >
                        {studentID}
                    </Text>
                </View>
            </View>

            <View style={styles.touchableOpacity}>
                {play ? (
                    <Video
                        ref={videoRef}
                        source={{ uri: video }}
                        style={styles.thumbnailImage}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        onPlaybackStatusUpdate={status => {
                            if (status.didJustFinish) {
                                setPlay(false);
                            }
                        }}
                    />
                ) : (
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={handlePlayback}
                        style={styles.thumbnailContainer}
                    >
                        <Image
                            source={{ uri: thumbnail }}
                            style={styles.thumbnailImage}
                            resizeMode='cover'
                        />
                        <Image 
                            source={icons.play}
                            style={styles.playIcon}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
        width: '100%',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        width: '100%',
    },
    avatarContainer: {
        width: 46,
        height: 46,
        borderColor: 'gray',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 23,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 23,
    },
    textContainer: {
        justifyContent: 'center',
        flex: 1,
        marginLeft: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    icon: {
        width: 20,
        height: 20,
        marginLeft: 8,
    },
    usernameText: {
        color: 'gray',
        fontSize: 12,
    },
    titleText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
        flex: 1,
    },
    touchableOpacity: {
        width: '100%',
        height: 240,
        borderRadius: 12,
        marginTop: 12,
        overflow: 'hidden',
    },
    thumbnailContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    playIcon: {
        position: 'absolute',
        width: 48,
        height: 48,
    },
});

export default VideoCard;