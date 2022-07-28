const fs = require('node:fs');

module.exports = class configMan{

    static path = './config/config.json';
    static config;
    
    static {
        try{
            this.config = JSON.parse(fs.readFileSync(this.path));
        }catch(error){
            this.config = JSON.parse(fs.readFileSync('./config/configDefault.json'));
            this.writeConfig(this.config);
        }
    }

    /** Writes current config to file
     *  Also sets current active config
     * @param {Object} newConf the new configuration as an object
     */
    static writeConfig(newConf){
        fs.writeFileSync(this.path, JSON.stringify(newConf));
        this.config = newConf;
    }

    /** Reads config from file
     *  Sets and returns the active config object
     * @param {String?} filePath path of the config to load
     * @returns {Object} config 
     */
    static readConfig(filePath){
        this.config = JSON.parse(fs.readFileSync((filePath||this.path)));
        return this.config;
    }
}