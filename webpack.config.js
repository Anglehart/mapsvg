module.exports = {
    entry: './js/mapsvg-admin/gutenberg/mapsvg-gutenberg.js',
    output: {
        path: __dirname,
        filename: 'dist/mapsvg-gutenberg.build.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-react']
                        }
                    }
                ],
            }
        ]
    },
};