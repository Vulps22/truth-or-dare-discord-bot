/*
const serverSaveMock = jest.fn().mockResolvedValue();
const serverSetLevelRoleMock = jest.fn().mockResolvedValue();
const serverGetLevelRoleMock = jest.fn().mockResolvedValue();
const serverHasPremiumFalseMock = jest.fn().mockResolvedValue(false);
const serverHasPremiumTrueMock = jest.fn().mockResolvedValue(true);
const serverGetEntitlementEndDateMock = jest.fn().mockResolvedValue();
const serverIsUsingMessageLevellingMock = jest.fn().mockResolvedValue();
const serverDeleteServerMock = jest.fn().mockResolvedValue();
const serverGetUsersMock = jest.fn().mockResolvedValue();

const serverSetXpRateMock = jest.fn();
const serverAcceptedStringMock = jest.fn();
const serverBannedStringMock = jest.fn();

const serverClearMocks = () => {
    serverSaveMock.mockClear();
    serverSetLevelRoleMock.mockClear();
    serverGetLevelRoleMock.mockClear();
    serverHasPremiumFalseMock.mockClear();
    serverHasPremiumTrueMock.mockClear();
    serverGetEntitlementEndDateMock.mockClear();
    serverIsUsingMessageLevellingMock.mockClear();
    serverDeleteServerMock.mockClear();
    serverGetUsersMock.mockClear();
    serverSetXpRateMock.mockClear();
    serverAcceptedStringMock.mockClear();
    serverBannedStringMock.mockClear();
    mock.mockClear
};

const mock = jest.fn().mockImplementation(() => {
  return {
    find: serverFindMock.mockImplementation(function () {
        return this;
      }),
      load: serverLoadMock.mockImplementation(function () {
        return this;
      }),
    save: serverSaveMock,
    setLevelRole: serverSetLevelRoleMock,
    getLevelRole: serverGetLevelRoleMock,
    hasPremium: serverHasPremiumMock,
    getEntitlementEndDate: serverGetEntitlementEndDateMock,
    isUsingMessageLevelling: serverIsUsingMessageLevellingMock,
    setXpRate: serverSetXpRateMock,
    acceptedString: serverAcceptedStringMock,
    bannedString: serverBannedStringMock,
    deleteServer: serverDeleteServerMock,
    getUsers: serverGetUsersMock,
  };
});

module.exports = {
  serverSaveMock,
  serverSetLevelRoleMock,
  serverGetLevelRoleMock,
  serverHasPremiumTrueMock,
  serverHasPremiumFalseMock,
  serverGetEntitlementEndDateMock,
  serverIsUsingMessageLevellingMock,
  serverDeleteServerMock,
  serverGetUsersMock,
  serverSetXpRateMock,
  serverAcceptedStringMock,
  serverBannedStringMock,
  serverClearMocks,
  default: mock
}
*/