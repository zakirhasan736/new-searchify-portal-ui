import CONFIG from "../../config/users/Constant";

//DOMAIN PROCESSING
export const getOrganicCompetitor = async(domain, offset, limit, database) => {
    var _domain = domain!=null? _domain : "amazon.com";
    var _database = database!=null? database: "us";
    var _offset = offset!=null? offset : 0;
    var _limit = limit!=null? limit : 10;

    return await fetch(CONFIG.hostname + ':8084/api/analytic/keyword/questions?phrase='
                        + _phrase + "&database=" 
                        + _database + "&offset="
                        + _offset + "&limit="
                        + _limit,{
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
    });
}


//TRAFFIC ANALYTIC PROCESSING

//targets : amazon.com, youtube.com   (multi websites seperate by comma)
//displayDate: yyyy-MM example 2023-02
//countryCode: us
export const getSummary = async(targets, displayDate, countryCode) => {
  var _targets = targets!=null? targets : "amazon.com, youtube.com";
  var _displayDate = displayDate!=null? displayDate: "2023-03";
  var _countryCode = countryCode!=null? countryCode: "us";
  return await fetch(CONFIG.hostname + ':8084/api/analytic/traffic/summary?targets='
                      + _targets + "&displayDate=" 
                      + _displayDate + "&countryCode="
                      + _countryCode,{
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
  });
}

//target : amazon.com
//period: MONTH / SEMESTER / YEAR
//countryCode: us
export const getSummaryHistory = async(targets, period, countryCode) => {
  var _target = targets!=null? targets : "amazon.com";
  var _period = period!=null? period: "MONTH";
  var _countryCode = countryCode!=null? countryCode: "us";
  return await fetch(CONFIG.hostname + ':8084/api/analytic/traffic/summary/history?target='
                      + _target + "&period=" 
                      + _period + "&countryCode="
                      + _countryCode,{
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
  });
}

//target : amazon.com
//displayDate: yyyy-MM example 2023-02
//countryCode: us
//offset: 0
//limit: 10
export const getTopPages = async(target, displayDate, countryCode, offset, limit) => {
  var _target = targets!=null? target : "amazon.com";
  var _displayDate = displayDate!=null? displayDate: "2023-03";
  var _countryCode = countryCode!=null? countryCode: "us";
  var _offset = offset!=null? offset : 0;
  var _limit = limit!=null? limit : 10;
  return await fetch(CONFIG.hostname + ':8084/api/analytic/traffic/top-pages?target='
                      + _target + "&displayDate=" 
                      + _displayDate + "&countryCode="
                      + _countryCode + "&offset=" 
                      + _offset + "&limit="
                      + _limit,{
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
  });
}

//target : amazon.com
//displayDate: yyyy-MM example 2023-02
//offset: 0
//limit: 10
export const getTopSubfolders = async(target, displayDate, offset, limit) => {
  var _target = targets!=null? target : "amazon.com";
  var _displayDate = displayDate!=null? displayDate: "2023-03";
  var _offset = offset!=null? offset : 0;
  var _limit = limit!=null? limit : 10;
  return await fetch(CONFIG.hostname + ':8084/api/analytic/traffic/top-subfolders?target='
                      + _target + "&displayDate=" 
                      + _displayDate + "&offset=" 
                      + _offset + "&limit="
                      + _limit,{
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
  });
}


//target : amazon.com
//displayDate: yyyy-MM example 2023-02
//offset: 0
//limit: 10
export const getTopSubdomains = async(target, displayDate, offset, limit) => {
  var _target = targets!=null? target : "amazon.com";
  var _displayDate = displayDate!=null? displayDate: "2023-03";
  var _offset = offset!=null? offset : 0;
  var _limit = limit!=null? limit : 10;
  return await fetch(CONFIG.hostname + ':8084/api/analytic/traffic/top-subdomains?target='
                      + _target + "&displayDate=" 
                      + _displayDate + "&offset=" 
                      + _offset + "&limit="
                      + _limit,{
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
  });
}


//target : amazon.com
//displayDate: yyyy-MM example 2023-02
//offset: 0
//limit: 10
export const getTrafficDestination = async(target, displayDate, offset, limit) => {
  var _target = target!=null? target : "amazon.com";
  var _displayDate = displayDate!=null? displayDate: "2023-03";
  var _offset = offset!=null? offset : 0;
  var _limit = limit!=null? limit : 10;
  return await fetch(CONFIG.hostname + ':8084/api/analytic/traffic/destinations?target='
                      + _target + "&displayDate=" 
                      + _displayDate + "&offset=" 
                      + _offset + "&limit="
                      + _limit,{
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
  });
}

//target : amazon.com
//displayDate: yyyy-MM example 2023-02
//geoType: COUNTRY / CONTINENT / SUBCONTINENT
//offset: 0
//limit: 10
export const getGeoDistribution = async(target, displayDate, geoType, offset, limit) => {
  var _target = target!=null? target : "amazon.com";
  var _displayDate = displayDate!=null? displayDate: "2023-03";
  var _geoType = geoType!=null? geoType: "COUNTRY";
  var _offset = offset!=null? offset : 0;
  var _limit = limit!=null? limit : 10;
  return await fetch(CONFIG.hostname + ':8084/api/analytic/traffic/geo-distribution?target='
                      + _target + "&displayDate=" 
                      + _displayDate + "&geoType=" 
                      + _geoType + "&offset=" 
                      + _offset + "&limit="
                      + _limit,{
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
  });
}

//target : amazon.com
//displayDate: yyyy-MM example 2023-02
//countryCode: us
export const getAgeSexDistribution = async(target, displayDate) => {
  var _target = target!=null? target : "amazon.com";
  var _displayDate = displayDate!=null? displayDate: "2023-03";
  return await fetch(CONFIG.hostname + ':8084/api/analytic/traffic/age-sex-distribution?targets='
                      + _target + "&displayDate=" 
                      + _displayDate ,{
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
  });
}

//KEYWORD PROCESSING
export const getKeywordOverview = async(phrase, database) => {
    var _phrase = phrase!=null? phrase : "peace";
    var _database = database!=null? database: "us";



    return await fetch(CONFIG.hostname + ':8084/api/analytic/keyword/questions?phrase='
                        + _phrase + "&database=" 
                        + _database, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
    });
}
export const getKeywordKDI = async(phrases, database) => {
    var _phrases = phrases!=null? phrases : "peace";
    var _database = database!=null? database: "us";



    return await fetch(CONFIG.hostname + ':8084/api/analytic/keyword/questions?phrase='
                        + _phrases + "&database=" 
                        + _database, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
    });
}

export const getKeywordBroadMatch = async(phrase, database, offset, limit) => {
    var _phrase = phrase!=null? phrase : "peace";
    var _database = database!=null? database: "us";
    var _offset = offset!=null? offset : 0;
    var _limit = limit!=null? limit : 10;


    return await fetch(CONFIG.hostname + ':8084/api/analytic/keyword/questions?phrase='
                        + _phrase + "&database=" 
                        + _database + "&offset="
                        + _offset + "&limit="
                        + _limit,{
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
    });
}


export const getKeywordQuestions = async(phrase, database, offset, limit) => {
    var _phrase = phrase!=null? phrase : "peace";
    var _database = database!=null? database: "us";
    var _offset = offset!=null? offset : 0;
    var _limit = limit!=null? limit : 10;


    return await fetch(CONFIG.hostname + ':8084/api/analytic/keyword/questions?phrase='
                        + _phrase + "&database=" 
                        + _database + "&offset="
                        + _offset + "&limit="
                        + _limit,{
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
    });
}

export const getKeywordRelated = async(phrase, database, offset, limit) => {
    var _phrase = phrase!=null? phrase : "peace";
    var _database = database!=null? database: "us";
    var _offset = offset!=null? offset : 0;
    var _limit = limit!=null? limit : 10;


    return await fetch(CONFIG.hostname + ':8084/api/analytic/keyword/questions?phrase='
                        + _phrase + "&database=" 
                        + _database + "&offset="
                        + _offset + "&limit="
                        + _limit,{
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
    });
}

