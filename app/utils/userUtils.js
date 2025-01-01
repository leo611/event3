export const validateUserSession = (user) => {
    if (!user || !user.$id) {
        return {
            isValid: false,
            error: 'No user session found'
        };
    }

    return {
        isValid: true,
        userId: user.$id
    };
}; 