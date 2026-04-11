# Manual Assignment Creator - Implementation Guide

## Overview

The manual assignment creator is a complete React component that enables teachers to create assignments with questions manually. It's fully integrated with the Learnify application following the project conventions.

## Files Created/Modified

### 1. **New File: `src/pages/assignment/create/manual-assignment-creator-page.jsx`**

- Complete assignment creation page with three steps
- Fully responsive UI using Tailwind CSS
- Integrated with lucide-react icons
- Supports multiple question types

### 2. **Modified: `src/routes/router.jsx`**

- Added import for `ManualAssignmentCreatorPage`
- Updated routes:
  - `/assignments/create/manual/questions` → ManualAssignmentCreatorPage
  - `/classrooms/:id/assignments/create/manual/questions` → ManualAssignmentCreatorPage

## Features

### Step 1: Setup

Users define the basic assignment properties:

- **Title** (required): Name of the assignment
- **Description** (optional): Instructions for students
- **Category**: Choose between "Homework" or "Test"
- **Format**: Select assignment format
  - "Multiple Choice" (MC)
  - "Essay"
  - "Mixed" (MC + Essay sections)
- **Test Configuration** (only for "Test" category):
  - Duration in minutes
  - Total score
  - Shuffle questions option
  - Show results after submission option

### Step 2: Editor

Teachers create the actual questions:

- **Section Management**:
  - Rename sections
  - Switch section type (MC ↔ Essay)
  - Delete sections (min 2 required for mixed format)
  - Add new sections for mixed format

- **Question Management**:
  - Add/delete questions
  - Edit question prompt
  - Set points per question
  - Choose question type

- **Question Types Supported**:
  1. **Multiple Choice**:
     - Add/remove options (2-8 options)
     - Mark correct answer
     - Visual feedback with color coding
  2. **True/False**:
     - Select Correct/Incorrect
     - Active state highlighting
  3. **Fill in the Blank**:
     - Custom hint support
     - Multiple blank support
     - Answer key entry
  4. **Essay**:
     - Text area for question
     - Optional sample answer guidance

- **Features**:
  - Auto-save with visual indicator
  - Total points tracking
  - Real-time validation
  - Drag-handle ready (GripV component)
  - Error highlighting on invalid fields

### Step 3: Success

Confirmation after successful publication with options to:

- Create a new assignment
- Assign to classroom

## Validation

The component validates at publish time:

### Question-level Validation

- ✓ Question prompt is not empty
- ✓ MC options are not empty and at least one is correct
- ✓ True/False has a selection

### Assignment-level Validation

- ✓ Mixed format requires minimum 2 sections
- ✓ For "Test" category: Total points must equal test score

### Error Display

- Errors highlighted in red background
- Inline error messages under problematic fields
- Modal dialog showing all errors on publish attempt

## State Management

### Core State Variables

```javascript
- step: 'setup' | 'editor' | 'success'
- title: string
- description: string
- category: 'homework' | 'test'
- format: 'mc' | 'essay' | 'mixed'
- testConfig: { duration, totalScore, shuffle, showResult }
- sections: Array<Section>
- autoSaveStatus: 'idle' | 'saving' | 'saved'
- validationErrors: Array
- modal: Object | null
- toast: Object | null
```

### Data Structures

**Section**:

```javascript
{
  id: number,
  title: string,
  type: 'multiple-choice' | 'essay',
  questions: Array<Question>
}
```

**Question**:

```javascript
{
  id: number,
  type: string,
  prompt: string,
  points: number,
  options: Array<Option>,
  correctTF: boolean | null,
  sampleAnswer: string,
  errors: Array
}
```

**Option**:

```javascript
{
  id: number,
  text: string,
  isCorrect: boolean
}
```

## UI Components

### Reusable Internal Components

- Icon system (using lucide-react)
- Modal system with typed dialogs (danger, warning, etc.)
- Toast notifications
- Auto-save indicator
- Points tracker

## Styling

### Tailwind Classes Used

- Color palette: Gray, Blue, Green, Red, Orange, Purple, Yellow
- Spacing: Follows standard Tailwind scale
- Border radius: `rounded-lg`, `rounded-xl`, `rounded-full`
- Typography: Font weights vary from 400-700
- Shadows: `shadow-sm`, `shadow-lg`, `shadow-2xl`
- Layout: Flexbox and Grid for responsive design

### Responsive Breakpoints

Currently optimized for desktop. Mobile optimization can be added with:

- `md:` prefix for tablet adjustments
- `sm:` prefix for mobile adjustments

## Integration Points

### Ready for API Integration

The component is structured to easily integrate with API endpoints:

1. **Draft Session Management**:
   - `assignmentApi.initManualDraftSession()`
   - `assignmentApi.getDraftSession()`
   - `assignmentApi.autoSaveDraftItem()`
   - `assignmentApi.confirmDraftSession()`

2. **Assignment Publishing**:
   - `assignmentApi.createAssignment()`
   - `assignmentApi.publishAssignment()`

3. **Questions**:
   - `assignmentApi.createAssignmentQuestionsBatch()`

### Recommended Implementation

Replace the `handlePublish()` function with actual API calls:

```javascript
const handlePublish = async () => {
  const errs = validate();
  if (errs.length > 0) {
    // Show errors
    return;
  }

  try {
    // Create assignment
    const assignmentPayload = {
      title,
      description,
      category,
      format,
      status: "DRAFT",
      totalScore: category === "test" ? testConfig.totalScore : 0,
      setting: testConfig,
    };
    const assignmentResp =
      await assignmentApi.createAssignment(assignmentPayload);
    const assignmentId = assignmentResp.data.result.id;

    // Create sections and questions
    for (const section of sections) {
      const sectionResp = await assignmentApi.createSection(assignmentId, {
        title: section.title,
        sectionType: section.type,
      });
      const sectionId = sectionResp.data.result.id;

      // Create questions
      for (const question of section.questions) {
        const questionPayload = convertQuestionToPayload(question);
        await assignmentApi.createAssignmentQuestion(
          assignmentId,
          sectionId,
          questionPayload,
        );
      }
    }

    // Publish assignment
    await assignmentApi.publishAssignment(assignmentId, []);

    setStep("success");
    showToast("Bài tập đã được xuất bản thành công!");
  } catch (error) {
    showToast(error.message, "error");
  }
};
```

## Styling Details

### Color Variables Used

- **Primary**: `bg-blue-600`, `text-blue-600`
- **Success**: `bg-green-600`, `text-green-600`
- **Danger**: `bg-red-600`, `text-red-600`
- **Warning**: `bg-yellow-600`, `text-yellow-600`
- **Background**: `bg-white`, `bg-gray-50`, `bg-gray-100`
- **Borders**: `border-gray-200`, `border-gray-300`
- **Text**: `text-gray-900`, `text-gray-600`, `text-gray-500`

### Special Effects

- **Hover States**: All interactive elements have hover effects
- **Focus States**: Form inputs have focus rings with blue accent
- **Transitions**: All animations use `transition` class for smooth effects
- **Gradients**: Used in headers and panels for visual hierarchy

## Accessibility Features

- Semantic HTML (button, input, textarea, select, label)
- Color contrast meets WCAG standards
- Keyboard navigation ready
- Form labels properly associated with inputs
- ARIA-friendly modal structure

## Testing Recommendations

### Manual Testing

1. **Setup Step**:
   - Test required fields validation
   - Test category and format selection
   - Test test config visibility based on category

2. **Editor Step**:
   - Create sections with different types
   - Add/remove questions and options
   - Test validation error display
   - Test total points calculation

3. **Success Step**:
   - Verify data is passed correctly
   - Test navigation options

### Browser Testing

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Future Enhancements

1. **Drag & Drop**: Implement question reordering with drag handles
2. **Question Bank Integration**: Load pre-created questions
3. **Batch Import**: CSV/Excel import functionality
4. **Preview Mode**: Preview questions as students will see them
5. **Keyboard Navigation**: Add keyboard shortcuts
6. **Accessibility**: Further improve WCAG compliance
7. **Responsive Design**: Add mobile optimizations

## Dependencies

- React 19.x
- react-router-dom v7
- lucide-react (icons)
- Tailwind CSS (styling)
- axios (API calls - via @/lib/http)

## Notes

- All color and styling are done via Tailwind CSS utility classes
- No external CSS files required for this component
- Icons are imported from lucide-react
- Component follows functional React patterns
- Uses hooks for state management (useState, useEffect, useRef, useCallback)
- No Redux required for this component
