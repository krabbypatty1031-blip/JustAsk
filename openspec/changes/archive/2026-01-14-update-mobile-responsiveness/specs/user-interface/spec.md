## ADDED Requirements
### Requirement: Mobile Device Responsiveness
The user interface SHALL adapt seamlessly to mobile device screens, including those with notches and safe area requirements (e.g., modern iPhones).

#### Scenario: Viewport configuration
- **WHEN** the application is loaded on a mobile device
- **THEN** the viewport meta tag SHALL include `viewport-fit=cover`
- **AND** the content SHALL extend to the edges of the screen

#### Scenario: Safe area insets
- **WHEN** the application runs on a device with a notch or home indicator
- **THEN** content SHALL NOT be obscured by hardware features
- **AND** padding SHALL be applied using `env(safe-area-inset-*)` CSS variables
- **AND** the bottom navigation bar SHALL accommodate the home indicator without cutting off content

#### Scenario: Mobile layout adaptation
- **WHEN** the screen width is narrow (e.g., < 400px)
- **THEN** multi-column layouts SHALL collapse to single columns
- **AND** no horizontal scrolling SHALL be required to read text
- **AND** elements SHALL fit within the screen width without overflow

## MODIFIED Requirements
### Requirement: Touch-Friendly Interactive Elements
The user interface SHALL provide large touch targets to accommodate users with reduced fine motor control.

#### Scenario: Buttons are large enough to tap
- **WHEN** a user views any button
- **THEN** the minimum touch target SHALL be 48x48px
- **AND** primary action buttons SHALL be at least 56x56px

#### Scenario: Form inputs are accessible
- **WHEN** a user interacts with form inputs
- **THEN** all input fields SHALL have a minimum height of 48px
- **AND** font size within inputs SHALL be at least 18px (to prevent iOS auto-zoom)
- **AND** clear, visible borders SHALL be present
