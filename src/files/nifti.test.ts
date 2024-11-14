import { assert, assertEquals, assertObjectMatch } from '@std/assert'
import { FileIgnoreRules } from './ignore.ts'
import { BIDSFileDeno } from './deno.ts'

import { loadHeader, axisCodes } from './nifti.ts'

Deno.test('Test loading nifti header', async (t) => {
  const ignore = new FileIgnoreRules([])

  await t.step('Load header from compressed 3D file', async () => {
    const path = 'sub-01/anat/sub-01_T1w.nii.gz'
    const root = './tests/data/valid_headers'
    const file = new BIDSFileDeno(root, path, ignore)
    const header = await loadHeader(file)
    assert(header !== undefined)
    assertObjectMatch(header, {
      dim: [3, 40, 48, 48, 1, 1, 1, 1],
      shape: [40, 48, 48],
      dim_info: { freq: 0, phase: 0, slice: 0 },
      xyzt_units: { xyz: 'mm', t: 'sec' },
      qform_code: 1,
      sform_code: 1,
    })
    // Annoying floating point precision, skipping pixdim details
    assert(header.voxel_sizes.length === 3)
  })

  await t.step('Load header from compressed 4D file', async () => {
    const path = 'sub-01/func/sub-01_task-rhymejudgment_bold.nii.gz'
    const root = './tests/data/valid_headers'
    const file = new BIDSFileDeno(root, path, ignore)
    const header = await loadHeader(file)
    assert(header !== undefined)
    assertObjectMatch(header, {
      dim: [4, 16, 16, 9, 20, 1, 1, 1],
      pixdim: [0, 12.5, 12.5, 16, 1, 0, 0, 0],
      shape: [16, 16, 9, 20],
      voxel_sizes: [12.5, 12.5, 16, 1],
      dim_info: { freq: 0, phase: 0, slice: 0 },
      xyzt_units: { xyz: 'mm', t: 'sec' },
      qform_code: 0,
      sform_code: 0,
    })
  })

  await t.step('Fail on non-nifti file', async () => {
    const path = 'sub-01/func/sub-01_task-rhymejudgment_events.tsv'
    const root = './tests/data/valid_headers'
    const file = new BIDSFileDeno(root, path, ignore)
    let error: any = undefined
    const header = await loadHeader(file).catch((e) => {
      error = e
    })
    assertObjectMatch(error, { key: 'NIFTI_HEADER_UNREADABLE' })
  })
})

Deno.test('Test extracting axis codes', async (t) => {
  await t.step('Identify RAS', async () => {
    const affine = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
    assertEquals(axisCodes(affine), ['R', 'A', 'S'])
  })
  await t.step('Identify LPS (flips)', async () => {
    const affine = [[-1, 0, 0, 0], [0, -1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
    assertEquals(axisCodes(affine), ['L', 'P', 'S'])
  })
  await t.step('Identify SPL (flips + swap)', async () => {
    const affine = [[0, 0, -1, 0], [0, -1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1]]
    assertEquals(axisCodes(affine), ['S', 'P', 'L'])
  })
  await t.step('Identify SLP (flips + rotate)', async () => {
    const affine = [[0, -1, 0, 0], [0, 0, -1, 0], [1, 0, 0, 0], [0, 0, 0, 1]]
    assertEquals(axisCodes(affine), ['S', 'L', 'P'])
  })
  await t.step('Identify ASR (rotate)', async () => {
    const affine = [[0, 0, 1, 0], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1]]
    assertEquals(axisCodes(affine), ['A', 'S', 'R'])
  })
})
