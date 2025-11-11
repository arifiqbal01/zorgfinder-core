wp-content/plugins/zorgfinder-core/
│
├── zorgfinder-core.php                # Entry file (minimal code)
├── composer.json                      # Composer autoloader & dependencies
├── composer.lock
├── vendor/                            # Composer vendor folder (gitignored)
│
├── bootstrap/                         # Boot sequence & service initialization
│   ├── helpers.php
│   └── setup.php
│
├── config/                            # Configs, constants, environment vars
│   ├── constants.php
│   ├── routes.php                     # API route definitions
│   └── services.php                   # List of classes to bootstrap
│
├── src/                               # Core source code (PSR-4)
│   ├── Admin/                         # Admin-specific functionality
│   │   ├── AdminMenu.php
│   │   ├── AppointmentsTable.php
│   │   └── ProvidersTable.php
│   │
│   ├── API/                           # REST API Controllers
│   │   ├── ProvidersController.php
│   │   ├── CompareController.php
│   │   ├── FavouritesController.php
│   │   └── BaseController.php
│   │
│   ├── Database/                      # Database table management
│   │   ├── DBManager.php
│   │   ├── Migrations/
│   │   │   ├── CreateProvidersTable.php
│   │   │   ├── CreateFavouritesTable.php
│   │   │   ├── CreateReimbursementsTable.php
│   │   │   └── MigrationRunner.php
│   │   └── Models/
│   │       ├── Provider.php
│   │       ├── Favourite.php
│   │       └── Reimbursement.php
│   │
│   ├── Services/                      # Business logic, utilities
│   │   ├── ProviderService.php
│   │   ├── ComparisonService.php
│   │   ├── ValidationService.php
│   │   └── EmailService.php
│   │
│   ├── Traits/                        # Shared reusable traits
│   │   ├── SingletonTrait.php
│   │   └── SanitizationTrait.php
│   │
│   ├── Interfaces/                    # Define contracts for services
│   │   ├── CRUDInterface.php
│   │   └── ServiceInterface.php
│   │
│   ├── Exceptions/                    # Custom exception handlers
│   │   ├── NotFoundException.php
│   │   └── ValidationException.php
│   │
│   └── Core.php                       # Main orchestrator class
│
├── tests/                             # Unit and integration tests
│   ├── ApiTest.php
│   └── DatabaseTest.php
│
├── assets/                            # CSS/JS (if admin-specific)
│   ├── css/
│   └── js/
│
└── readme.md
