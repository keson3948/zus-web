var LOREM_IPSUM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

var cc = initCookieConsent();
cc.run({
    current_lang: 'en',
    autoclear_cookies: true,                    // default: false
    cookie_name: 'cc_cookie',             // default: 'cc_cookie'
    cookie_expiration: 365,                     // default: 182
    page_scripts: true,                         // default: false
    force_consent: true,
    auto_language: 'document',                        // default: false

    //,                     // default: null; could also be 'browser' or 'document'
    // autorun: true,                           // default: true
    // delay: 0,                                // default: 0
    // hide_from_bots: false,                   // default: false
    // remove_cookie_tables: false              // default: false
    // cookie_domain: location.hostname,        // default: current domain
    // cookie_path: '/',                        // default: root
    // cookie_same_site: 'Lax',
    // use_rfc_cookie: false,                   // default: false
    // revision: 0,                             // default: 0

    gui_options: {
        consent_modal: {
            layout: 'cloud',                    // box,cloud,bar
            position: 'bottom center',          // bottom,middle,top + left,right,center
            transition: 'slide',
            swap_buttons: false  // zoom,slide
        },
        settings_modal: {
            layout: 'box',                      // box,bar
            position: 'left',                   // right,left (available only if bar layout selected)
            transition: 'slide'                 // zoom,slide
        }
    },

    onFirstAction: function(){
        console.log('onFirstAction fired');
    },

    onAccept: function (cookie) {
        console.log('onAccept fired!')
    },

    onChange: function (cookie, changed_preferences) {
        console.log('onChange fired!');

        // If analytics category is disabled => disable google analytics
        if (!cc.allowedCategory('analytics')) {
            typeof gtag === 'function' && gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
    },

    languages: {
        'cs': {
            consent_modal: {
                title: 'Aby vše fungovalo jak má, používáme cookies &#127850;',
                description: 'Naše webové stránky používají cookies a další nástroje, které jsou nutné k běhu webových stránek, ke sběru anonymních statistik návštěvnosti, pro zobrazení relevatních reklam a běh vložených medií. Pokud kliknete na „Souhlasím“, souhlasíte s použitím všech cookies. V části „Nastavení cookies“ můžete spravovat, které soubory cookies chcete (ne)povolit. Toto nastavení můžete kdykoli změnit. Detailní informace o používaných cookies <a href="/cookies-policy">naleznete zde</a>',
                primary_btn: {
                    text: 'Souhlasím',
                    role: 'accept_all'      //'accept_selected' or 'accept_all'
                },
                secondary_btn: {
                    text: 'Nastavení cookies',
                    role: 'settings'       //'settings' or 'accept_necessary'
                },
                revision_message: '<br><br> Dear user, terms and conditions have changed since the last time you visisted!'
            },
            settings_modal: {
                title: 'Nastavení cookies',
                save_settings_btn: 'Uložit mé předvolby',
                accept_all_btn: 'Povolit vše',
                reject_all_btn: 'Odmítnout vše',
                close_btn_label: 'Zavřít',
                cookie_table_headers: [
                    {col1: 'Name'},
                    {col2: 'Domain'},
                    {col3: 'Expiration'}
                ],
                blocks: [
                    {
                        title: 'Vaše soukromí je pro nás důležité',
                        description: 'Soubory cookies jsou velmi malé textové soubory, které se ukládají do vašeho zařízení při navštěvování webových stránek. Soubory Cookies používáme pro různé účely a pro vylepšení vašeho online zážitku na webové stránce (například pro zapamatování přihlašovacích údajů k vašemu účtu).<br><br>Při procházení našich webových stránek můžete změnit své předvolby a odmítnout určité typy cookies, které se mají ukládat do vašeho počítače. Můžete také odstranit všechny soubory cookie, které jsou již uloženy ve vašem počítači, ale mějte na paměti, že odstranění souborů cookie vám může zabránit v používání částí našeho webu.'
                    }, {
                        title: 'Technicky nutné',
                        toggle: {
                            value: 'necessary',
                            enabled: true,
                            readonly: true  //cookie categories with readonly=true are all treated as "necessary cookies"
                        }
                    }, {
                        title: 'Statistické',
                        toggle: {
                            value: 'analytics',
                            enabled: false,
                            readonly: false
                        },
                    }, {
                        title: 'Marketingové',
                        toggle: {
                            value: 'targeting',
                            enabled: false,
                            readonly: false,
                            reload: 'on_disable'            // New option in v2.4, check readme.md
                        },
                    },{
                        title: 'Více informací',
                        description: 'Nejste si jistí? Pro více informací nás můžete kontaktovat. <a class="cc-link" href="/kontakty">Kontakty</a>.',
                    }
                ]
            }
        },
        'en': {
            consent_modal: {
                title: 'To make everything work as it should, we use cookies &#127850;',
                description: 'Our website uses cookies and other tools that are necessary to run the website, to collect anonymous traffic statistics, to display relevant advertisements and to run embedded media. If you click "I agree", you agree to the use of all cookies. In the "Cookie settings" section you can manage which cookies you want to (dis)allow. You can change these settings at any time.',
                primary_btn: {
                    text: 'I agree',
                    role: 'accept_all'      //'accept_selected' or 'accept_all'
                },
                secondary_btn: {
                    text: 'Cookies settings',
                    role: 'settings'       //'settings' or 'accept_necessary'
                },
                revision_message: '<br><br> Dear user, terms and conditions have changed since the last time you visisted!'
            },
            settings_modal: {
                title: 'Cookie settings',
                save_settings_btn: 'Save my preferences',
                accept_all_btn: 'I agree',
                reject_all_btn: 'I decline',
                close_btn_label: 'Close',
                cookie_table_headers: [
                    {col1: 'Name'},
                    {col2: 'Domain'},
                    {col3: 'Expiration'}
                ],
                blocks: [
                    {
                        title: 'Your privacy is important to us',
                        description: 'Cookies are very small text files that are stored on your device when you visit a website. We use cookies for various purposes and to improve your online experience on the website (for example, to remember your account login details).<br><br>You can change your preferences and refuse certain types of cookies to be stored on your computer when you browse our website. You can also delete any cookies that are already stored on your computer, but keep in mind that removing cookies may prevent you from using parts of our site.'
                    }, {
                        title: 'Technically necessary',
                        toggle: {
                            value: 'necessary',
                            enabled: true,
                            readonly: true  //cookie categories with readonly=true are all treated as "necessary cookies"
                        }
                    }, {
                        title: 'Statistics',
                        toggle: {
                            value: 'analytics',
                            enabled: false,
                            readonly: false
                        },
                       
                    }, {
                        title: 'Marketing ',
                        toggle: {
                            value: 'targeting',
                            enabled: false,
                            readonly: false,
                            reload: 'on_disable'            // New option in v2.4, check readme.md
                        },
                    }
                ]
            }
        }
    }
});