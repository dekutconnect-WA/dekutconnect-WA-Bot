const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testNekokun() {
    console.log('🧪 Starting Nekokun Endpoints Test...\n');

    try {
        // 1. Test Home
        console.log('--- Testing Home ---');
        const homeRes = await axios.get(`${BASE_URL}/api/anime/nekokun/home`);
        console.log('Home Status:', homeRes.data.success ? '✅ Success' : '❌ Failed');
        if (homeRes.data.success) {
            console.log('Latest Count:', homeRes.data.result.latest.data.length);
            console.log('Popular Count:', homeRes.data.result.popular.length);
        }

        // 2. Test Search
        console.log('\n--- Testing Search (query: "boruto") ---');
        const searchRes = await axios.get(`${BASE_URL}/api/anime/nekokun/search?q=boruto`);
        console.log('Search Status:', searchRes.data.success ? '✅ Success' : '❌ Failed');
        if (!searchRes.data.success) {
            console.log('Error Message:', searchRes.data.message || searchRes.data.error);
        }
        
        let testUrl = '';
        if (searchRes.data.success) {
            console.log('Results data:', JSON.stringify(searchRes.data.result.data, null, 2));
            if (searchRes.data.result.data.length > 0) {
                console.log('Found:', searchRes.data.result.data.length, 'results');
                testUrl = searchRes.data.result.data[0].original_url;
                console.log('Sample URL for Detail:', testUrl);
            } else {
                console.log('⚠️ No results found for "boruto".');
            }
        }

        // 3. Test Detail
        if (testUrl) {
            console.log('\n--- Testing Detail ---');
            const detailRes = await axios.get(`${BASE_URL}/api/anime/nekokun/detail?url=${encodeURIComponent(testUrl)}`);
            console.log('Detail Status:', detailRes.data.success ? '✅ Success' : '❌ Failed');
            let episodeUrl = '';
            if (detailRes.data.success) {
                console.log('Title:', detailRes.data.result.title);
                console.log('Episode Count:', detailRes.data.result.episodes.length);
                if (detailRes.data.result.episodes.length > 0) {
                    episodeUrl = detailRes.data.result.episodes[0].original_url;
                    console.log('Sample URL for Stream:', episodeUrl);
                }
            }

            // 4. Test Stream
            if (episodeUrl) {
                console.log('\n--- Testing Stream ---');
                const streamRes = await axios.get(`${BASE_URL}/api/anime/nekokun/stream?url=${encodeURIComponent(episodeUrl)}`);
                console.log('Stream Status:', streamRes.data.success ? '✅ Success' : '❌ Failed');
                if (streamRes.data.success) {
                    console.log('Streaming Links:', streamRes.data.result.streaming.length);
                    console.log('Download Links:', streamRes.data.result.download.length);
                }
            }
        }

        console.log('\n✨ All tests completed.');

    } catch (error) {
        console.error('\n❌ Test Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testNekokun();
