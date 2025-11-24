# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a UniApp-based interactive map navigation mini-program called "潮起东方" (Chaoshan Odyssey) - a cultural heritage game set in the Chaoshan region of Guangdong, China. The app uses Vue 3, TypeScript, and Pinia for state management.

## Architecture

### Core Structure
- **Framework**: UniApp with Vue 3 + TypeScript + Vite
- **State Management**: Pinia with composition API
- **Multi-platform Support**: H5, WeChat Mini Program, and other mini-program platforms
- **Game Logic**: Location-based interactive storytelling with character progression

### Key Directories
- `src/` - Main application source code
  - `pages/` - Application pages (currently just index page)
  - `stores/` - Pinia state management stores
  - `mock/` - Game data and mock information
  - `static/` - Static assets (images, audio, etc.)

### Game Architecture
- **Multi-city system**: Currently supports Jieyang, with placeholders for Chaozhou and Shantou
- **Character-based gameplay**: 7 unique characters with different storylines and goals
- **POI system**: Points of Interest with NPCs, challenges, and collectible seals
- **Seal collection mechanic**: 5 seals per city that can be combined to unlock secrets
- **Interactive storytelling**: Branching narratives based on character choices

## Development Commands

### Development (各平台开发)
```bash
# H5 development
npm run dev:h5

# WeChat Mini Program development
npm run dev:mp-weixin

# Other platforms available:
npm run dev:mp-alipay      # Alipay Mini Program
npm run dev:mp-baidu       # Baidu Mini Program
npm run dev:mp-toutiao     # Toutiao Mini Program
npm run dev:mp-kuaishou    # Kuaishou Mini Program
npm run dev:quickapp-webview  # Quick App
```

### Building (构建发布)
```bash
# Build for H5
npm run build:h5

# Build for WeChat Mini Program
npm run build:mp-weixin

# Other platform builds follow the same pattern
```

### Type Checking
```bash
npm run type-check  # Run TypeScript type checking
```

## Key Game Components

### Store System (`src/stores/useGameStore.ts`)
- **Game State**: Current city, character, inventory, mission progress
- **Multi-city Support**: Switch between Jieyang, Chaozhou, Shantou
- **Inventory System**: Manage seals, clues, and items
- **Progress Tracking**: Monitor game phases and completion status
- **Map Integration**: Generate markers for unlocked POIs

### Game Data (`src/mock/gameData.ts`)
- **Character System**: 7 playable characters with unique backstories
- **NPC System**: 5 NPCs per city, each guarding a seal
- **POI System**: Cultural landmarks with GPS coordinates
- **Seal Mechanics**: Collectible items with puzzle-solving features
- **Story Progression**: 4-phase game flow with multiple endings

### Main Page (`src/pages/index/index.vue`)
- **Map Interface**: Interactive map with character markers
- **Character Selection**: Swiper-based character selection carousel
- **HUD System**: City switcher, character info, inventory access
- **Navigation**: Tab-based navigation system

## Game Mechanics

### Seal Collection System
- 5 main seals per city (儒学文脉, 青狮非遗, 功夫茶韵, 侨批信义)
- 1 final seal (老爷保号章) that combines the others
- Seals have physical puzzle positions for 2x2 combination
- Special features for authentication and story progression

### Character Progression
- Each character has unique goals and special abilities
- Hidden relationships between characters (e.g., plunderer vs guardians)
- Story-based unlocking of new locations and content
- Multiple victory conditions based on character alignment

### Location-Based Gameplay
- Real GPS coordinates for Chaoshan cultural sites
- Progressive unlocking based on seal collection
- NPC interactions with dialogue trees and challenges
- Cultural education integrated into gameplay

## Development Notes

### Pinia Integration
- Uses special import syntax: `import * as Pinia from 'pinia'`
- Store instance must be returned as `Pinia: store` for UniApp compatibility
- Composition API pattern with reactive state management

### Multi-Platform Considerations
- GPS location permissions required for map functionality
- Different platform build targets have different capabilities
- WeChat Mini Program requires specific appid configuration
- H5 version provides fallback functionality

### TypeScript Configuration
- Strict type checking enabled
- Custom type definitions in `src/shime-uni.d.ts` and `src/env.d.ts`
- Interface definitions for all game entities

### Asset Management
- Static assets stored in `src/static/` with organized subdirectories
- Image paths use absolute references from static root
- Audio files for background music at each location
- Character avatars and location backgrounds

## Testing and Deployment

### Local Development
- Use H5 mode for rapid prototyping and testing
- WeChat Developer Tools for mini-program testing
- Device testing recommended for GPS functionality

### Platform-Specific Requirements
- WeChat Mini Program: Requires appid and permission configuration
- Location services: User permission must be requested
- Map functionality: Different implementations per platform

This project represents a sophisticated cultural heritage game that combines education, entertainment, and tourism promotion for the Chaoshan region.