export const headerConfig = {
  index: {
    label: "Home",
    href: "./"
  },
  login: {
    login: {
      href: "./"
    }
  },
  slots: [
    {
      label: "Settings",
      iconName: "icon-settings",
      slot: "settings"
    }
  ],
  navigation: {
    main: {
      label: "Navigation", 
      children: [
        {
          label: "NL2SQL",
          href: "/"
        }
      ]
    }
  }
};