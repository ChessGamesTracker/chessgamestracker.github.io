async function getFidePlayerData(fideId) {
    try {
        // Validate FIDE ID format
        if (!String(fideId).match(/^\d+$/)) {
            throw new Error('Invalid FIDE ID format');
        }

        // Construct URLs
        const fideUrl = `https://ratings.fide.com/profile/${fideId}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(fideUrl)}`;

        // Fetch data
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.contents) {
            throw new Error('No data received from FIDE');
        }

        // Parse HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, "text/html");

        // Extract all relevant data
        const playerData = {
            personalInfo: {
                name: doc.querySelector(".profile-top-title")?.textContent.trim() || null,
                federation: doc.querySelector(".profile-top-info__row_federation")?.textContent.trim() || null,
                birthYear: doc.querySelector(".profile-top-info__row_born")?.textContent.trim() || null,
                sex: doc.querySelector(".profile-top-info__row_sex")?.textContent.trim() || null,
                title: doc.querySelector(".profile-top-info__row_title")?.textContent.trim() || null
            },
            ratings: {
                standard: {
                    rating: doc.querySelector(".profile-top-rating-data_gray")?.textContent.trim() || null,
                    games: doc.querySelector(".profile-top-rating-games_gray")?.textContent.trim() || null,
                    k_factor: doc.querySelector(".profile-top-rating-k_gray")?.textContent.trim() || null
                },
                rapid: {
                    rating: doc.querySelector(".profile-top-rating-data_red")?.textContent.trim() || null,
                    games: doc.querySelector(".profile-top-rating-games_red")?.textContent.trim() || null,
                    k_factor: doc.querySelector(".profile-top-rating-k_red")?.textContent.trim() || null
                },
                blitz: {
                    rating: doc.querySelector(".profile-top-rating-data_blue")?.textContent.trim() || null,
                    games: doc.querySelector(".profile-top-rating-games_blue")?.textContent.trim() || null,
                    k_factor: doc.querySelector(".profile-top-rating-k_blue")?.textContent.trim() || null
                }
            },
            status: 'success'
        };

        // Clean up the data by removing null values
        const cleanData = (obj) => {
            Object.keys(obj).forEach(key => {
                if (obj[key] === null) {
                    delete obj[key];
                } else if (typeof obj[key] === 'object') {
                    cleanData(obj[key]);
                }
            });
            return obj;
        };

        return cleanData(playerData);

    } catch (error) {
        return {
            status: 'error',
            message: error.message,
            details: error.toString()
        };
    }
}

// Usage example:
/*
getFidePlayerData("1503014")
    .then(data => console.log(data))
    .catch(error => console.error(error));

// Sample response:
{
    personalInfo: {
        name: "Magnus Carlsen",
        federation: "NOR",
        birthYear: "1990",
        title: "GM"
    },
    ratings: {
        standard: {
            rating: "2830",
            games: "34",
            k_factor: "10"
        },
        rapid: {
            rating: "2800",
            games: "18"
        },
        blitz: {
            rating: "2886",
            games: "42"
        }
    },
    status: "success"
}
*/